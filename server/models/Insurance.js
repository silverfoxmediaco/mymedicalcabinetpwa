const mongoose = require('mongoose');

const InsuranceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        name: {
            type: String,
            required: [true, 'Insurance provider name is required']
        },
        phone: String,
        website: String
    },
    plan: {
        name: String,
        type: {
            type: String,
            enum: ['HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'Medicare', 'Medicaid', 'Other'],
            default: 'Other'
        }
    },
    memberId: {
        type: String,
        required: [true, 'Member ID is required']
    },
    groupNumber: {
        type: String
    },
    subscriberName: {
        type: String
    },
    subscriberDOB: {
        type: Date
    },
    relationship: {
        type: String,
        enum: ['self', 'spouse', 'child', 'other'],
        default: 'self'
    },
    effectiveDate: {
        type: Date
    },
    terminationDate: {
        type: Date
    },
    coverage: {
        deductible: {
            individual: Number,
            family: Number,
            met: Number
        },
        outOfPocketMax: {
            individual: Number,
            family: Number,
            met: Number
        },
        copay: {
            primaryCare: Number,
            specialist: Number,
            urgentCare: Number,
            emergency: Number
        },
        coinsurance: Number // percentage
    },
    cardImages: {
        front: String, // URL to stored image
        back: String
    },
    documents: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        s3Key: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    // FHIR API connection for insurance sync
    fhirConnection: {
        connected: {
            type: Boolean,
            default: false
        },
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Date,
        patientId: String,
        lastSynced: Date
    },
    isPrimary: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
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

InsuranceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

InsuranceSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Insurance', InsuranceSchema);
