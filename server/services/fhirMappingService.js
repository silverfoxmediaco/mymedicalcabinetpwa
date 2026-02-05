/**
 * FHIR Mapping Service
 * Maps FHIR R4 resources to MyMedicalCabinet schema
 */

const Medication = require('../models/Medication');
const MedicalHistory = require('../models/MedicalHistory');
const Doctor = require('../models/Doctor');

/**
 * Extract display text from a FHIR CodeableConcept
 */
const getCodeableConceptText = (codeableConcept) => {
    if (!codeableConcept) return null;
    if (codeableConcept.text) return codeableConcept.text;
    if (codeableConcept.coding && codeableConcept.coding[0]) {
        return codeableConcept.coding[0].display || codeableConcept.coding[0].code;
    }
    return null;
};

/**
 * Extract name from FHIR HumanName
 */
const getHumanName = (nameArray) => {
    if (!nameArray || nameArray.length === 0) return null;
    const name = nameArray[0];
    if (name.text) return name.text;
    const parts = [];
    if (name.prefix) parts.push(name.prefix.join(' '));
    if (name.given) parts.push(name.given.join(' '));
    if (name.family) parts.push(name.family);
    if (name.suffix) parts.push(name.suffix.join(' '));
    return parts.join(' ').trim() || null;
};

/**
 * Extract phone from FHIR telecom array
 */
const getPhone = (telecom) => {
    if (!telecom) return null;
    const phone = telecom.find(t => t.system === 'phone');
    return phone?.value || null;
};

/**
 * Extract email from FHIR telecom array
 */
const getEmail = (telecom) => {
    if (!telecom) return null;
    const email = telecom.find(t => t.system === 'email');
    return email?.value || null;
};

/**
 * Extract NPI from FHIR identifier array
 */
const getNPI = (identifiers) => {
    if (!identifiers) return null;
    const npi = identifiers.find(id =>
        id.system === 'http://hl7.org/fhir/sid/us-npi' ||
        id.type?.coding?.some(c => c.code === 'NPI')
    );
    return npi?.value || null;
};

/**
 * Map FHIR MedicationRequest to Medication schema
 */
const mapMedicationRequest = (resource, providerId) => {
    const name = getCodeableConceptText(resource.medicationCodeableConcept) ||
                 resource.medicationReference?.display ||
                 'Unknown Medication';

    // Parse dosage
    let dosageAmount = null;
    let dosageUnit = 'mg';
    const dosageInstruction = resource.dosageInstruction?.[0];
    if (dosageInstruction?.doseAndRate?.[0]?.doseQuantity) {
        const doseQty = dosageInstruction.doseAndRate[0].doseQuantity;
        dosageAmount = doseQty.value?.toString();
        if (doseQty.unit) {
            const unitMap = { 'mg': 'mg', 'mcg': 'mcg', 'g': 'g', 'ml': 'ml', 'mL': 'ml' };
            dosageUnit = unitMap[doseQty.unit] || 'other';
        }
    }

    // Parse frequency
    let frequency = 'other';
    const timingCode = dosageInstruction?.timing?.code?.text?.toLowerCase() || '';
    const timingRepeat = dosageInstruction?.timing?.repeat;
    if (timingCode.includes('daily') || timingCode.includes('qd')) {
        frequency = 'once daily';
    } else if (timingCode.includes('bid') || timingCode.includes('twice')) {
        frequency = 'twice daily';
    } else if (timingCode.includes('tid') || timingCode.includes('three')) {
        frequency = 'three times daily';
    } else if (timingCode.includes('qid') || timingCode.includes('four')) {
        frequency = 'four times daily';
    } else if (timingCode.includes('prn') || timingCode.includes('as needed')) {
        frequency = 'as needed';
    } else if (timingCode.includes('weekly')) {
        frequency = 'weekly';
    } else if (timingRepeat?.frequency && timingRepeat?.period) {
        const freq = timingRepeat.frequency;
        const period = timingRepeat.period;
        const periodUnit = timingRepeat.periodUnit;
        if (periodUnit === 'd' && period === 1) {
            if (freq === 1) frequency = 'once daily';
            else if (freq === 2) frequency = 'twice daily';
            else if (freq === 3) frequency = 'three times daily';
            else if (freq === 4) frequency = 'four times daily';
        } else if (periodUnit === 'wk' && period === 1) {
            frequency = 'weekly';
        }
    }

    // Map status
    let status = 'active';
    if (['stopped', 'completed', 'cancelled', 'entered-in-error'].includes(resource.status)) {
        status = 'discontinued';
    }

    return {
        name,
        dosage: dosageAmount ? { amount: dosageAmount, unit: dosageUnit } : undefined,
        frequency,
        prescribedBy: resource.requester?.display || null,
        prescribedDate: resource.authoredOn ? new Date(resource.authoredOn) : null,
        purpose: resource.reasonCode?.[0] ? getCodeableConceptText(resource.reasonCode[0]) : null,
        instructions: dosageInstruction?.text || null,
        status,
        fhirSource: {
            synced: true,
            provider: providerId,
            resourceId: resource.id,
            lastSynced: new Date()
        }
    };
};

/**
 * Map FHIR Condition to MedicalHistory.conditions schema
 */
const mapCondition = (resource, providerId) => {
    const name = getCodeableConceptText(resource.code) || 'Unknown Condition';

    // Map clinical status
    let status = 'active';
    const clinicalStatus = resource.clinicalStatus?.coding?.[0]?.code;
    if (clinicalStatus === 'resolved' || clinicalStatus === 'remission') {
        status = 'resolved';
    } else if (clinicalStatus === 'inactive') {
        status = 'managed';
    }

    return {
        name,
        diagnosedDate: resource.onsetDateTime ? new Date(resource.onsetDateTime) :
                       resource.recordedDate ? new Date(resource.recordedDate) : null,
        status,
        notes: resource.note?.[0]?.text || null,
        fhirSource: {
            synced: true,
            provider: providerId,
            resourceId: resource.id,
            lastSynced: new Date()
        }
    };
};

/**
 * Map FHIR AllergyIntolerance to MedicalHistory.allergies schema
 */
const mapAllergyIntolerance = (resource, providerId) => {
    const allergen = getCodeableConceptText(resource.code) || 'Unknown Allergen';

    // Get reaction
    let reaction = null;
    if (resource.reaction?.[0]?.manifestation?.[0]) {
        reaction = getCodeableConceptText(resource.reaction[0].manifestation[0]);
    }

    // Map severity/criticality
    let severity = 'moderate';
    if (resource.criticality === 'low') {
        severity = 'mild';
    } else if (resource.criticality === 'high') {
        severity = 'severe';
    }

    return {
        allergen,
        reaction,
        severity,
        fhirSource: {
            synced: true,
            provider: providerId,
            resourceId: resource.id,
            lastSynced: new Date()
        }
    };
};

/**
 * Map FHIR Procedure to MedicalHistory.surgeries schema
 */
const mapProcedure = (resource, providerId) => {
    const procedure = getCodeableConceptText(resource.code) || 'Unknown Procedure';

    // Get date
    let date = null;
    if (resource.performedDateTime) {
        date = new Date(resource.performedDateTime);
    } else if (resource.performedPeriod?.start) {
        date = new Date(resource.performedPeriod.start);
    }

    // Get surgeon/performer
    let surgeon = null;
    if (resource.performer?.[0]?.actor?.display) {
        surgeon = resource.performer[0].actor.display;
    }

    // Get hospital/location
    let hospital = null;
    if (resource.location?.display) {
        hospital = resource.location.display;
    }

    return {
        procedure,
        date,
        surgeon,
        hospital,
        notes: resource.note?.[0]?.text || null,
        fhirSource: {
            synced: true,
            provider: providerId,
            resourceId: resource.id,
            lastSynced: new Date()
        }
    };
};

/**
 * Map FHIR Encounter class to eventType
 */
const mapEncounterClass = (encounterClass) => {
    if (!encounterClass?.code) return 'other';
    const code = encounterClass.code.toLowerCase();
    const classMap = {
        'amb': 'checkup',
        'emer': 'er_visit',
        'imp': 'hospital_stay',
        'acute': 'hospital_stay',
        'nonac': 'hospital_stay',
        'obsenc': 'hospital_stay',
        'prenc': 'checkup',
        'ss': 'procedure',
        'hh': 'other',
        'vr': 'other'
    };
    return classMap[code] || 'other';
};

/**
 * Map FHIR Encounter to MedicalHistory.events schema
 */
const mapEncounter = (resource, providerId) => {
    // Build description
    let description = 'Healthcare Visit';
    if (resource.type?.[0]) {
        description = getCodeableConceptText(resource.type[0]) || description;
    } else if (resource.reasonCode?.[0]) {
        description = getCodeableConceptText(resource.reasonCode[0]) || description;
    }

    // Get date
    let date = null;
    if (resource.period?.start) {
        date = new Date(resource.period.start);
    }

    // Get provider
    let provider = null;
    if (resource.participant?.[0]?.individual?.display) {
        provider = resource.participant[0].individual.display;
    } else if (resource.serviceProvider?.display) {
        provider = resource.serviceProvider.display;
    }

    // Get location/address
    let providerAddress = null;
    if (resource.location?.[0]?.location?.display) {
        providerAddress = resource.location[0].location.display;
    }

    return {
        description,
        eventType: mapEncounterClass(resource.class),
        date,
        provider,
        providerAddress,
        notes: resource.reasonCode?.[0] ? getCodeableConceptText(resource.reasonCode[0]) : null,
        fhirSource: {
            synced: true,
            provider: providerId,
            resourceId: resource.id,
            lastSynced: new Date()
        }
    };
};

/**
 * Map FHIR Immunization to MedicalHistory.events schema (vaccination type)
 */
const mapImmunization = (resource, providerId) => {
    const vaccineName = getCodeableConceptText(resource.vaccineCode) || 'Vaccination';
    const description = `Vaccination: ${vaccineName}`;

    // Get date
    let date = null;
    if (resource.occurrenceDateTime) {
        date = new Date(resource.occurrenceDateTime);
    } else if (resource.occurrenceString) {
        date = new Date(resource.occurrenceString);
    }

    // Get provider/performer
    let provider = null;
    if (resource.performer?.[0]?.actor?.display) {
        provider = resource.performer[0].actor.display;
    }

    // Get location
    let providerAddress = null;
    if (resource.location?.display) {
        providerAddress = resource.location.display;
    }

    return {
        description,
        eventType: 'vaccination',
        date,
        provider,
        providerAddress,
        notes: resource.note?.[0]?.text || null,
        fhirSource: {
            synced: true,
            provider: providerId,
            resourceId: resource.id,
            lastSynced: new Date()
        }
    };
};

/**
 * Map FHIR Practitioner to Doctor schema
 */
const mapPractitioner = (resource, providerId) => {
    const name = getHumanName(resource.name) || 'Unknown Provider';

    // Get specialty from qualification
    let specialty = null;
    if (resource.qualification?.[0]?.code) {
        specialty = getCodeableConceptText(resource.qualification[0].code);
    }

    // Get contact info
    const phone = getPhone(resource.telecom);
    const email = getEmail(resource.telecom);
    const npiNumber = getNPI(resource.identifier);

    // Get address
    let practice = null;
    if (resource.address?.[0]) {
        const addr = resource.address[0];
        practice = {
            address: {
                street: addr.line?.join(', ') || null,
                city: addr.city || null,
                state: addr.state || null,
                zipCode: addr.postalCode || null
            }
        };
    }

    return {
        name,
        specialty,
        phone,
        email,
        npiNumber,
        practice,
        fhirSource: {
            synced: true,
            provider: providerId,
            resourceId: resource.id,
            lastSynced: new Date()
        }
    };
};

/**
 * Sync FHIR data to app models
 * @param {string} userId - User ID
 * @param {string} providerId - FHIR provider ID (e.g., 'wellmark')
 * @param {object} fhirData - Raw FHIR data from fetchPatientData
 * @returns {object} Summary of synced records
 */
const syncFhirDataToModels = async (userId, providerId, fhirData) => {
    const summary = {
        medications: { created: 0, updated: 0, skipped: 0 },
        conditions: { created: 0, updated: 0, skipped: 0 },
        allergies: { created: 0, updated: 0, skipped: 0 },
        surgeries: { created: 0, updated: 0, skipped: 0 },
        events: { created: 0, updated: 0, skipped: 0 },
        doctors: { created: 0, updated: 0, skipped: 0 }
    };

    // === MEDICATIONS ===
    if (fhirData.medicationRequest?.length) {
        for (const resource of fhirData.medicationRequest) {
            if (!resource.id) continue;

            try {
                const mapped = mapMedicationRequest(resource, providerId);

                // Check for existing by FHIR resourceId
                const existing = await Medication.findOne({
                    userId,
                    'fhirSource.resourceId': resource.id,
                    'fhirSource.provider': providerId
                });

                if (existing) {
                    // Update existing
                    Object.assign(existing, mapped);
                    await existing.save();
                    summary.medications.updated++;
                } else {
                    // Check for duplicate by name (user may have added manually)
                    const byName = await Medication.findOne({
                        userId,
                        name: { $regex: new RegExp(`^${mapped.name}$`, 'i') }
                    });

                    if (byName && !byName.fhirSource?.synced) {
                        // Link existing manual entry to FHIR
                        byName.fhirSource = mapped.fhirSource;
                        await byName.save();
                        summary.medications.updated++;
                    } else if (!byName) {
                        // Create new
                        await Medication.create({ ...mapped, userId });
                        summary.medications.created++;
                    } else {
                        summary.medications.skipped++;
                    }
                }
            } catch (err) {
                console.error(`Error syncing medication ${resource.id}:`, err.message);
                summary.medications.skipped++;
            }
        }
    }

    // === MEDICAL HISTORY (conditions, allergies, surgeries, events) ===
    let medHistory = await MedicalHistory.findOne({ userId });
    if (!medHistory) {
        medHistory = await MedicalHistory.create({ userId });
    }

    // --- Conditions ---
    if (fhirData.condition?.length) {
        for (const resource of fhirData.condition) {
            if (!resource.id) continue;

            try {
                const mapped = mapCondition(resource, providerId);

                // Check for existing by FHIR resourceId
                const existingIdx = medHistory.conditions.findIndex(
                    c => c.fhirSource?.resourceId === resource.id && c.fhirSource?.provider === providerId
                );

                if (existingIdx >= 0) {
                    // Update existing
                    Object.assign(medHistory.conditions[existingIdx], mapped);
                    summary.conditions.updated++;
                } else {
                    // Check by name
                    const byNameIdx = medHistory.conditions.findIndex(
                        c => c.name.toLowerCase() === mapped.name.toLowerCase() && !c.fhirSource?.synced
                    );

                    if (byNameIdx >= 0) {
                        medHistory.conditions[byNameIdx].fhirSource = mapped.fhirSource;
                        summary.conditions.updated++;
                    } else if (!medHistory.conditions.some(c => c.name.toLowerCase() === mapped.name.toLowerCase())) {
                        medHistory.conditions.push(mapped);
                        summary.conditions.created++;
                    } else {
                        summary.conditions.skipped++;
                    }
                }
            } catch (err) {
                console.error(`Error syncing condition ${resource.id}:`, err.message);
                summary.conditions.skipped++;
            }
        }
    }

    // --- Allergies ---
    if (fhirData.allergyIntolerance?.length) {
        for (const resource of fhirData.allergyIntolerance) {
            if (!resource.id) continue;

            try {
                const mapped = mapAllergyIntolerance(resource, providerId);

                const existingIdx = medHistory.allergies.findIndex(
                    a => a.fhirSource?.resourceId === resource.id && a.fhirSource?.provider === providerId
                );

                if (existingIdx >= 0) {
                    Object.assign(medHistory.allergies[existingIdx], mapped);
                    summary.allergies.updated++;
                } else {
                    const byNameIdx = medHistory.allergies.findIndex(
                        a => a.allergen.toLowerCase() === mapped.allergen.toLowerCase() && !a.fhirSource?.synced
                    );

                    if (byNameIdx >= 0) {
                        medHistory.allergies[byNameIdx].fhirSource = mapped.fhirSource;
                        summary.allergies.updated++;
                    } else if (!medHistory.allergies.some(a => a.allergen.toLowerCase() === mapped.allergen.toLowerCase())) {
                        medHistory.allergies.push(mapped);
                        summary.allergies.created++;
                    } else {
                        summary.allergies.skipped++;
                    }
                }
            } catch (err) {
                console.error(`Error syncing allergy ${resource.id}:`, err.message);
                summary.allergies.skipped++;
            }
        }
    }

    // --- Procedures/Surgeries ---
    if (fhirData.procedure?.length) {
        for (const resource of fhirData.procedure) {
            if (!resource.id) continue;

            try {
                const mapped = mapProcedure(resource, providerId);

                const existingIdx = medHistory.surgeries.findIndex(
                    s => s.fhirSource?.resourceId === resource.id && s.fhirSource?.provider === providerId
                );

                if (existingIdx >= 0) {
                    Object.assign(medHistory.surgeries[existingIdx], mapped);
                    summary.surgeries.updated++;
                } else {
                    // Check by procedure name and date
                    const byNameIdx = medHistory.surgeries.findIndex(
                        s => s.procedure.toLowerCase() === mapped.procedure.toLowerCase() && !s.fhirSource?.synced
                    );

                    if (byNameIdx >= 0) {
                        medHistory.surgeries[byNameIdx].fhirSource = mapped.fhirSource;
                        summary.surgeries.updated++;
                    } else {
                        medHistory.surgeries.push(mapped);
                        summary.surgeries.created++;
                    }
                }
            } catch (err) {
                console.error(`Error syncing procedure ${resource.id}:`, err.message);
                summary.surgeries.skipped++;
            }
        }
    }

    // --- Encounters → Events ---
    if (fhirData.encounter?.length) {
        for (const resource of fhirData.encounter) {
            if (!resource.id) continue;

            try {
                const mapped = mapEncounter(resource, providerId);
                if (!mapped.date) {
                    summary.events.skipped++;
                    continue;
                }

                const existingIdx = medHistory.events.findIndex(
                    e => e.fhirSource?.resourceId === resource.id && e.fhirSource?.provider === providerId
                );

                if (existingIdx >= 0) {
                    Object.assign(medHistory.events[existingIdx], mapped);
                    summary.events.updated++;
                } else {
                    medHistory.events.push(mapped);
                    summary.events.created++;
                }
            } catch (err) {
                console.error(`Error syncing encounter ${resource.id}:`, err.message);
                summary.events.skipped++;
            }
        }
    }

    // --- Immunizations → Events (vaccination type) ---
    if (fhirData.immunization?.length) {
        for (const resource of fhirData.immunization) {
            if (!resource.id) continue;

            try {
                const mapped = mapImmunization(resource, providerId);
                if (!mapped.date) {
                    summary.events.skipped++;
                    continue;
                }

                const existingIdx = medHistory.events.findIndex(
                    e => e.fhirSource?.resourceId === resource.id && e.fhirSource?.provider === providerId
                );

                if (existingIdx >= 0) {
                    Object.assign(medHistory.events[existingIdx], mapped);
                    summary.events.updated++;
                } else {
                    medHistory.events.push(mapped);
                    summary.events.created++;
                }
            } catch (err) {
                console.error(`Error syncing immunization ${resource.id}:`, err.message);
                summary.events.skipped++;
            }
        }
    }

    // Save medical history
    await medHistory.save();

    // === DOCTORS/PRACTITIONERS ===
    if (fhirData.practitioners?.length) {
        for (const resource of fhirData.practitioners) {
            if (!resource.id) continue;

            try {
                const mapped = mapPractitioner(resource, providerId);

                // Check for existing by FHIR resourceId
                const existing = await Doctor.findOne({
                    patientId: userId,
                    'fhirSource.resourceId': resource.id,
                    'fhirSource.provider': providerId
                });

                if (existing) {
                    Object.assign(existing, mapped);
                    await existing.save();
                    summary.doctors.updated++;
                } else {
                    // Check by name
                    const byName = await Doctor.findOne({
                        patientId: userId,
                        name: { $regex: new RegExp(`^${mapped.name}$`, 'i') }
                    });

                    if (byName && !byName.fhirSource?.synced) {
                        byName.fhirSource = mapped.fhirSource;
                        if (mapped.npiNumber && !byName.npiNumber) byName.npiNumber = mapped.npiNumber;
                        if (mapped.specialty && !byName.specialty) byName.specialty = mapped.specialty;
                        await byName.save();
                        summary.doctors.updated++;
                    } else if (!byName) {
                        await Doctor.create({ ...mapped, patientId: userId });
                        summary.doctors.created++;
                    } else {
                        summary.doctors.skipped++;
                    }
                }
            } catch (err) {
                console.error(`Error syncing practitioner ${resource.id}:`, err.message);
                summary.doctors.skipped++;
            }
        }
    }

    return summary;
};

module.exports = {
    mapMedicationRequest,
    mapCondition,
    mapAllergyIntolerance,
    mapProcedure,
    mapEncounter,
    mapImmunization,
    mapPractitioner,
    syncFhirDataToModels
};
