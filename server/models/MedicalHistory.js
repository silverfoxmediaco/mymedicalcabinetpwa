const mongoose = require('mongoose');

const MedicalHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    familyMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        default: null
    },
    conditions: [{
        name: {
            type: String,
            required: true
        },
        diagnosedDate: Date,
        status: {
            type: String,
            enum: ['active', 'resolved', 'managed'],
            default: 'active'
        },
        notes: String,
        fhirSource: {
            synced: { type: Boolean, default: false },
            provider: String,
            resourceId: String,
            lastSynced: Date
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    allergies: [{
        allergen: {
            type: String,
            required: true
        },
        reaction: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
            default: 'moderate'
        },
        fhirSource: {
            synced: { type: Boolean, default: false },
            provider: String,
            resourceId: String,
            lastSynced: Date
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    surgeries: [{
        procedure: {
            type: String,
            required: true
        },
        date: Date,
        hospital: String,
        surgeon: String,
        notes: String,
        fhirSource: {
            synced: { type: Boolean, default: false },
            provider: String,
            resourceId: String,
            lastSynced: Date
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    familyHistory: [{
        condition: {
            type: String,
            required: true
        },
        relationship: {
            type: String,
            enum: ['mother', 'father', 'sibling', 'grandparent', 'other']
        },
        notes: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    events: [{
        description: {
            type: String,
            required: true
        },
        eventType: {
            type: String,
            enum: ['physical', 'checkup', 'specialist', 'urgent_care', 'er_visit', 'hospital_stay', 'procedure', 'lab_work', 'imaging', 'vaccination', 'therapy', 'other'],
            default: 'checkup'
        },
        date: {
            type: Date,
            required: true
        },
        provider: String,
        providerAddress: String,
        providerPhone: String,
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
        doctorName: String,
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
        prescribedMedications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medication' }],
        notes: String,
        documents: [{
            filename: String,
            originalName: String,
            mimeType: String,
            size: Number,
            s3Key: String,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        fhirSource: {
            synced: { type: Boolean, default: false },
            provider: String,
            resourceId: String,
            lastSynced: Date
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
        default: 'unknown'
    },
    height: {
        value: Number,
        unit: {
            type: String,
            enum: ['in', 'cm'],
            default: 'in'
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['lb', 'kg'],
            default: 'lb'
        }
    },
    socialHistory: {
        smokingStatus: { type: String, enum: ['never', 'former', 'current'], default: 'never' },
        smokingDetail: { type: String, trim: true },
        alcoholUse: { type: String, enum: ['none', 'occasional', 'moderate', 'heavy'], default: 'none' },
        alcoholDetail: { type: String, trim: true },
        drugUse: { type: String, enum: ['none', 'former', 'current'], default: 'none' },
        drugDetail: { type: String, trim: true },
        exerciseFrequency: { type: String, enum: ['none', 'occasional', '1-2-per-week', '3-4-per-week', 'daily'], default: 'none' },
        exerciseDetail: { type: String, trim: true },
        dietRestrictions: { type: String, trim: true }
    },
    pastMedicalChecklist: {
        diabetes: { type: Boolean, default: false },
        highBloodPressure: { type: Boolean, default: false },
        highCholesterol: { type: Boolean, default: false },
        heartDisease: { type: Boolean, default: false },
        heartAttack: { type: Boolean, default: false },
        stroke: { type: Boolean, default: false },
        cancer: { type: Boolean, default: false },
        cancerType: { type: String, trim: true },
        asthma: { type: Boolean, default: false },
        copd: { type: Boolean, default: false },
        thyroidDisease: { type: Boolean, default: false },
        kidneyDisease: { type: Boolean, default: false },
        liverDisease: { type: Boolean, default: false },
        arthritis: { type: Boolean, default: false },
        osteoporosis: { type: Boolean, default: false },
        mentalHealth: { type: Boolean, default: false },
        mentalHealthDetail: { type: String, trim: true },
        seizures: { type: Boolean, default: false },
        bloodClots: { type: Boolean, default: false },
        anemia: { type: Boolean, default: false },
        autoimmune: { type: Boolean, default: false },
        autoimmuneDetail: { type: String, trim: true },
        sleepApnea: { type: Boolean, default: false },
        migraines: { type: Boolean, default: false },
        glaucoma: { type: Boolean, default: false },
        hearingLoss: { type: Boolean, default: false }
    },
    familyHistoryChecklist: {
        diabetes: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        heartDisease: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        highBloodPressure: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        stroke: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        cancer: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        cancerType: { type: String, trim: true },
        mentalHealth: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        substanceAbuse: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        diabetes2: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        kidneyDisease: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        thyroidDisease: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        bloodClots: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        autoimmune: [{ type: String, enum: ['mother', 'father', 'sibling', 'grandparent'] }],
        otherDetail: { type: String, trim: true }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

MedicalHistorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('MedicalHistory', MedicalHistorySchema);
