/**
 * Foundry bridge bookkeeping (docs/foundry-bridge.md §2 and §3).
 *
 * - Adds foundryKey, foundryChangedAt, foundryRecordedAt, foundryRecordError.
 * - Marks a record as changed (foundryChangedAt = now, foundryRecordedAt = null)
 *   on save and on the update queries, so findByIdAndUpdate edits are caught too.
 * - Removes foundry* keys from incoming updates, so a client cannot mark its own
 *   record as sent. The bridge writes these fields through the native driver,
 *   which skips this middleware.
 * - Before a delete, collects the foundryKey of records already in Foundry and
 *   queues a delete action for each (keys only, no member data).
 * - After a save, asks the bridge to send the record (the bridge does nothing
 *   unless FOUNDRY_WRITES=1).
 *
 * Runs whether or not FOUNDRY_WRITES is on, so edits made while the bridge is
 * off are still sent once it is turned on.
 */

const FOUNDRY_FIELDS = ['foundryKey', 'foundryChangedAt', 'foundryRecordedAt', 'foundryRecordError'];
const UPDATE_QUERIES = ['updateOne', 'updateMany', 'findOneAndUpdate'];

// Lazy require: the bridge requires the models, which require this plugin.
const bridge = () => require('../../services/foundryBridge');

const stripFoundryKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(key => {
        if (key.startsWith('foundry')) {
            delete obj[key];
        } else if (key.startsWith('$')) {
            stripFoundryKeys(obj[key]);
        }
    });
};

function foundryTracked(schema) {
    schema.add({
        foundryKey: { type: String, default: null },
        foundryChangedAt: { type: Date, default: null },
        foundryRecordedAt: { type: Date, default: null },
        foundryRecordError: { type: String, default: null }
    });
    schema.index({ foundryRecordedAt: 1 });

    schema.post('init', function() {
        this.$locals.foundryAtLoad = {};
        FOUNDRY_FIELDS.forEach(field => {
            this.$locals.foundryAtLoad[field] = this.get(field);
        });
    });

    schema.pre('save', function(next) {
        if (this.isNew) {
            this.foundryKey = null;
            this.foundryRecordError = null;
        } else {
            // Undo any foundry* value copied in from a request body
            const atLoad = this.$locals.foundryAtLoad || {};
            FOUNDRY_FIELDS.forEach(field => {
                if (this.isModified(field)) this.set(field, atLoad[field] ?? null);
            });
            if (!this.isModified()) return next();
        }
        this.foundryChangedAt = new Date();
        this.foundryRecordedAt = null;
        next();
    });

    schema.post('save', function(doc) {
        bridge().sendSoon(doc.constructor.modelName, doc._id);
    });

    schema.pre(UPDATE_QUERIES, function(next) {
        const update = this.getUpdate();
        const mark = { foundryChangedAt: new Date(), foundryRecordedAt: null };

        if (Array.isArray(update)) {
            update.forEach(stage => stripFoundryKeys(stage));
            update.push({ $set: mark });
        } else if (update) {
            stripFoundryKeys(update);
            update.$set = { ...(update.$set || {}), ...mark };
        }
        this.setUpdate(update);
        next();
    });

    schema.post('findOneAndUpdate', function(doc) {
        if (doc) bridge().sendSoon(this.model.modelName, doc._id);
    });

    // Hard deletes leave nothing for the 5-minute pass to find, so the keys are
    // read before the delete runs. findOneAndDelete returns the deleted record.
    schema.pre(['deleteOne', 'deleteMany'], { document: false, query: true }, async function() {
        const query = this.model
            .find(this.getFilter(), { foundryKey: 1 })
            .where('foundryKey').ne(null)
            .lean();
        if (this.op === 'deleteOne') query.limit(1);
        try {
            const sent = await query;
            this._foundryKeysToDelete = sent.map(record => record.foundryKey);
        } catch (err) {
            // Never block a Mongo delete on bridge bookkeeping
            console.error('[Foundry] Could not read keys before delete:', err.message);
            this._foundryKeysToDelete = [];
        }
    });

    schema.post(['deleteOne', 'deleteMany'], { document: false, query: true }, async function() {
        const keys = this._foundryKeysToDelete || [];
        if (keys.length) await bridge().queueDeletes(this.model.modelName, keys);
    });

    schema.post('findOneAndDelete', async function(doc) {
        if (doc?.foundryKey) await bridge().queueDeletes(this.model.modelName, [doc.foundryKey]);
    });

    schema.post('deleteOne', { document: true, query: false }, async function(doc) {
        if (doc.foundryKey) await bridge().queueDeletes(doc.constructor.modelName, [doc.foundryKey]);
    });
}

module.exports = foundryTracked;
