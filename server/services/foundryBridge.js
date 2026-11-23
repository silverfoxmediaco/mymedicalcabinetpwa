/**
 * Foundry bridge: sends Mongo records to Palantir Foundry by ontology action
 * (docs/foundry-bridge.md). Mongo stays the front door; everything here runs
 * after the Mongo write and never throws back into a route.
 *
 * Off unless FOUNDRY_WRITES=1. With the flag unset no Foundry call is made and
 * the 5-minute pass does not run.
 *
 * To add a model: give its schema the foundryTracked plugin, then add an entry
 * to MODELS below (in the pass order of §8) once its object type and its
 * save/delete actions exist in Foundry. Use the action API names exactly as
 * Foundry lists them.
 */

const foundry = require('./foundryService');
const User = require('../models/User');
const EpicConnection = require('../models/EpicConnection');
const FoundryDeleteQueue = require('../models/FoundryDeleteQueue');

const PASS_LIMIT_PER_TYPE = 200;
const DELETE_LIMIT_PER_PASS = 200;
const ERROR_MAX_LENGTH = 300;
const EPIC_SANDBOX_HOST = 'fhir.epic.com';

const isEnabled = () => process.env.FOUNDRY_WRITES === '1';

// ---------- value helpers (never copy values into errors or logs) ----------

const text = (value) => (value === undefined || value === null || value === '' ? null : String(value));
const id = (value) => (value ? String(value) : null);
const timestamp = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const integer = (value) => (typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : null);
const bool = (value) => (typeof value === 'boolean' ? value : null);
const textList = (value) => (Array.isArray(value) ? value.filter(v => v !== null && v !== undefined).map(String) : []);

const patientKeyOf = (record, cfg) => String(record.familyMemberId || record[cfg.ownerField]);

const recordSourceOf = (record) => {
    const provider = record.fhirSource?.provider;
    if (!provider) return 'hand-entered';
    return provider === 'epic' ? 'epic' : 'payer-fhir';
};

// Primary key (§4): decided on the first send, then never changed.
const foundryKeyOf = (record, cfg) => {
    if (record.foundryKey) return record.foundryKey;
    const { provider, resourceId } = record.fhirSource || {};
    if (provider && resourceId) {
        return `${patientKeyOf(record, cfg)}:${provider}:${cfg.fhirResourceType}/${resourceId}`;
    }
    return String(record._id);
};

// Properties every object type carries (§5.1)
const scopingParameters = (record, cfg, key) => ({
    mmcKey: key,
    mongoId: String(record._id),
    patientKey: patientKeyOf(record, cfg),
    accountUserId: String(record[cfg.ownerField]),
    familyMemberId: id(record.familyMemberId),
    recordSource: recordSourceOf(record),
    fhirProvider: text(record.fhirSource?.provider),
    fhirResourceId: text(record.fhirSource?.resourceId),
    fhirLastSynced: timestamp(record.fhirSource?.lastSynced),
    mmcCreatedAt: timestamp(record.createdAt),
    mmcUpdatedAt: timestamp(record.updatedAt)
});

// Allow-list for MmcMedication (§5.2 row 2). Anything not listed is not sent.
const medicationParameters = (record, cfg, key) => ({
    ...scopingParameters(record, cfg, key),
    name: record.name,
    genericName: text(record.genericName),
    dosageAmount: text(record.dosage?.amount),
    dosageUnit: text(record.dosage?.unit),
    frequency: text(record.frequency),
    timeOfDay: textList(record.timeOfDay),
    prescribedBy: text(record.prescribedBy),
    prescribedDate: timestamp(record.prescribedDate),
    pharmacyName: text(record.pharmacy?.name),
    pharmacyPhone: text(record.pharmacy?.phone),
    pharmacyAddress: text(record.pharmacy?.address),
    refillsRemaining: integer(record.refillsRemaining),
    nextRefillDate: timestamp(record.nextRefillDate),
    purpose: text(record.purpose),
    sideEffects: text(record.sideEffects),
    instructions: text(record.instructions),
    status: text(record.status),
    ndcCode: text(record.scannedData?.ndcCode),
    manufacturer: text(record.scannedData?.manufacturer),
    route: text(record.route),
    site: text(record.site),
    category: text(record.category),
    code: text(record.code),
    codeSystem: text(record.codeSystem),
    statusReason: text(record.statusReason),
    patientInstruction: text(record.patientInstruction),
    reminderEnabled: bool(record.reminderEnabled),
    reminderTimes: textList(record.reminderTimes),
    startDate: timestamp(record.startDate),
    endDate: timestamp(record.endDate)
});

// Keyed by Mongoose model name, in the pass order of §8.
// Only MmcMedication exists in Foundry so far (save-mmc-medication, delete-mmc-medication).
const MODELS = {
    Medication: {
        model: () => require('../models/Medication'),
        ownerField: 'userId',
        objectType: 'MmcMedication',
        saveAction: 'save-mmc-medication',
        deleteAction: 'delete-mmc-medication',
        fhirResourceType: 'MedicationRequest',
        toParameters: medicationParameters
    }
};

const configForObjectType = (objectType) => Object.values(MODELS).find(cfg => cfg.objectType === objectType);

const errorText = (err) => {
    const message = err instanceof foundry.FoundryError ? err.message : `Bridge error (${err?.name || 'Error'})`;
    return message.slice(0, ERROR_MAX_LENGTH);
};

// ---------- health data gate (§9) ----------

/**
 * Mongo filter for the records that may be sent: only account holders with
 * User.foundryTestMember = true (family members follow their account holder),
 * hand-entered records, and Epic records only from the Epic sandbox. Payer
 * FHIR records are not sent. Records outside the gate are skipped, not marked
 * as failed, so they stay pending for when the gate is lifted.
 *
 * Lifting the gate is a code change in this function, in a pull request that
 * names the signed HIPAA BAA and the Foundry environment it covers.
 */
const sendableFilter = async (cfg) => {
    const testMemberIds = await User.find({ foundryTestMember: true }).distinct('_id');

    const connections = await EpicConnection
        .find({ userId: { $in: testMemberIds } }, { userId: 1, familyMemberId: 1, epicEndpoint: 1 })
        .lean();
    const sandboxConnections = connections.filter(conn => {
        try {
            return new URL(conn.epicEndpoint).hostname === EPIC_SANDBOX_HOST;
        } catch (err) {
            return false;
        }
    });

    return {
        $or: [
            { [cfg.ownerField]: { $in: testMemberIds }, 'fhirSource.provider': null },
            ...sandboxConnections.map(conn => ({
                [cfg.ownerField]: conn.userId,
                familyMemberId: conn.familyMemberId || null,
                'fhirSource.provider': 'epic'
            }))
        ]
    };
};

// ---------- saves ----------

/**
 * Send one record with the save action and record the result in Mongo.
 * The result is written only if the record was not edited again while the
 * call was in flight (conditional on foundryChangedAt); otherwise it stays
 * pending for the next pass. Bookkeeping goes through the native driver so
 * the foundryTracked middleware does not mark it as a member change.
 */
const sendRecord = async (modelName, record) => {
    const cfg = MODELS[modelName];
    const collection = cfg.model().collection;
    const key = foundryKeyOf(record, cfg);
    const sentVersion = { _id: record._id, foundryChangedAt: record.foundryChangedAt || null };

    try {
        await foundry.applyAction(cfg.saveAction, cfg.toParameters(record, cfg, key));
    } catch (err) {
        await collection.updateOne(sentVersion, { $set: { foundryRecordError: errorText(err) } });
        return false;
    }

    const result = await collection.updateOne(sentVersion, {
        $set: { foundryRecordedAt: new Date(), foundryKey: key, foundryRecordError: null }
    });

    // Deleted in Mongo while the first save was in flight: its delete hook saw
    // no foundryKey, so queue the delete here.
    if (!result.matchedCount && !record.foundryKey && !(await cfg.model().exists({ _id: record._id }))) {
        await queueDeletes(modelName, [key]);
    }
    return true;
};

const sendById = async (modelName, recordId) => {
    const cfg = MODELS[modelName];
    const filter = await sendableFilter(cfg);
    const record = await cfg.model().findOne({ _id: recordId, foundryRecordedAt: null, ...filter }).lean();
    if (record) await sendRecord(modelName, record);
};

// Sends requested right after a save, one at a time, in this process.
const soon = new Set();
let drainingSoon = false;

const drainSoon = async () => {
    try {
        while (soon.size) {
            const item = soon.values().next().value;
            soon.delete(item);
            const [modelName, recordId] = item.split(':');
            try {
                await sendById(modelName, recordId);
            } catch (err) {
                console.error(`[Foundry] Send after save failed (${modelName}): ${errorText(err)}`);
            }
        }
    } finally {
        drainingSoon = false;
    }
};

/**
 * Called by the foundryTracked plugin after a save. Returns at once; the
 * send runs after the current request has moved on. Never throws.
 */
const sendSoon = (modelName, recordId) => {
    if (!isEnabled() || !MODELS[modelName] || !recordId) return;
    soon.add(`${modelName}:${recordId}`);
    if (!drainingSoon) {
        drainingSoon = true;
        setImmediate(drainSoon);
    }
};

// ---------- deletes (§3) ----------

const deleteParameterOf = async (cfg) => {
    const actionType = await foundry.getActionType(cfg.deleteAction);
    const parameters = Object.entries(actionType?.parameters || {});
    const objectParam = parameters.find(([, param]) => param?.dataType?.type === 'object');
    if (objectParam) return objectParam[0];
    if (parameters.length === 1) return parameters[0][0];
    throw new foundry.FoundryError(`Foundry action ${cfg.deleteAction} has no object parameter`);
};

let deletingPromise = null;

const processDeleteQueue = () => {
    if (!deletingPromise) {
        deletingPromise = (async () => {
            const entries = await FoundryDeleteQueue.find().sort({ createdAt: 1 }).limit(DELETE_LIMIT_PER_PASS);
            let sent = 0;
            for (const entry of entries) {
                const cfg = configForObjectType(entry.objectType);
                try {
                    if (!cfg) throw new foundry.FoundryError(`No delete action for ${entry.objectType}`);
                    const param = await deleteParameterOf(cfg);
                    await foundry.applyAction(cfg.deleteAction, { [param]: entry.primaryKey });
                    await FoundryDeleteQueue.deleteOne({ _id: entry._id });
                    sent++;
                } catch (err) {
                    await FoundryDeleteQueue.updateOne(
                        { _id: entry._id },
                        { $inc: { attempts: 1 }, $set: { lastError: errorText(err) } }
                    );
                }
            }
            return { sent, failed: entries.length - sent };
        })().finally(() => {
            deletingPromise = null;
        });
    }
    return deletingPromise;
};

/**
 * Called by the foundryTracked plugin after a Mongo delete, with the keys of
 * records that were in Foundry. Writes them to FoundryDeleteQueue (keys only)
 * so a crash or a Foundry outage cannot lose a delete, then sends them if the
 * bridge is on. Never throws.
 */
const queueDeletes = async (modelName, keys) => {
    const cfg = MODELS[modelName];
    if (!cfg || !keys.length) return;
    try {
        await FoundryDeleteQueue.insertMany(keys.map(primaryKey => ({ objectType: cfg.objectType, primaryKey })));
        if (isEnabled()) {
            setImmediate(() => {
                processDeleteQueue().catch(err => console.error(`[Foundry] Delete send failed: ${errorText(err)}`));
            });
        }
    } catch (err) {
        console.error(`[Foundry] Could not queue deletes (${modelName}): ${errorText(err)}`);
    }
};

// ---------- 5-minute pass ----------

let passRunning = false;

/**
 * Delete queue first, then every pending record per model in pass order,
 * never-failed and oldest first, capped per type so the backfill of older
 * records runs in steady slices.
 */
const runPass = async () => {
    if (!isEnabled() || passRunning) return null;
    passRunning = true;
    try {
        const summary = { deletes: await processDeleteQueue() };
        for (const [modelName, cfg] of Object.entries(MODELS)) {
            const filter = await sendableFilter(cfg);
            const pending = await cfg.model()
                .find({ foundryRecordedAt: null, ...filter })
                .sort({ foundryRecordError: 1, foundryChangedAt: 1, _id: 1 })
                .limit(PASS_LIMIT_PER_TYPE)
                .lean();
            let sent = 0;
            for (const record of pending) {
                if (await sendRecord(modelName, record)) sent++;
            }
            summary[modelName] = { sent, failed: pending.length - sent };
        }
        return summary;
    } finally {
        passRunning = false;
    }
};

module.exports = {
    isEnabled,
    sendSoon,
    queueDeletes,
    runPass
};
