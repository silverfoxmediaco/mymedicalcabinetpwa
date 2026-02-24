const mongoose = require('mongoose');

const EpicConnectionSchema = new mongoose.Schema({
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
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    tokenExpiresAt: {
        type: Date,
        required: true
    },
    patientFhirId: {
        type: String,
        required: true
    },
    epicEndpoint: {
        type: String,
        required: true
    },
    healthSystemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthSystem',
        default: null
    },
    healthSystemName: {
        type: String,
        default: ''
    },
    epicTokenUrl: {
        type: String
    },
    scopes: {
        type: String
    },
    patientName: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'disconnected', 'error'],
        default: 'active'
    },
    lastSyncAt: {
        type: Date
    },
    syncHistory: [{
        resourceType: String,
        recordsImported: Number,
        syncedAt: { type: Date, default: Date.now }
    }],
    connectedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

EpicConnectionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

EpicConnectionSchema.methods.isTokenExpired = function() {
    return new Date() >= this.tokenExpiresAt;
};

EpicConnectionSchema.index({ userId: 1, familyMemberId: 1 }, { unique: true });

module.exports = mongoose.model('EpicConnection', EpicConnectionSchema);
