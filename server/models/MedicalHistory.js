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
