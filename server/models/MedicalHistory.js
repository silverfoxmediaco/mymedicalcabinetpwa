const mongoose = require('mongoose');

const MedicalHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
