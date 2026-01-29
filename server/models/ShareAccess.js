const mongoose = require('mongoose');
const crypto = require('crypto');

const ShareAccessSchema = new mongoose.Schema({
    // Patient who is sharing
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Doctor who has access (if doctor account)
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For QR code sharing
    accessCode: {
        type: String,
        unique: true,
        sparse: true
    },
    qrCodeData: {
        type: String
    },
    // What data is being shared
    permissions: {
        medicalHistory: {
            type: Boolean,
            default: true
        },
        medications: {
            type: Boolean,
            default: true
        },
        allergies: {
            type: Boolean,
            default: true
        },
        appointments: {
            type: Boolean,
            default: false
        },
        insurance: {
            type: Boolean,
            default: false
        },
        doctors: {
            type: Boolean,
            default: false
        }
    },
    // Access type
    type: {
        type: String,
        enum: ['qr-code', 'doctor-account', 'temporary-link'],
        required: true
    },
    // For temporary access
    expiresAt: {
        type: Date
    },
    // For doctor account access
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'revoked'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    approvedAt: {
        type: Date
    },
    // Access log
    accessLog: [{
        accessedAt: {
            type: Date,
            default: Date.now
        },
        accessedBy: String,
        ipAddress: String,
        dataAccessed: [String]
    }],
    // Usage tracking
    timesAccessed: {
        type: Number,
        default: 0
    },
    maxAccesses: {
        type: Number // null = unlimited
    },
    lastAccessedAt: {
        type: Date
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

// Generate unique access code before saving
ShareAccessSchema.pre('save', function(next) {
    if (!this.accessCode && this.type === 'qr-code') {
        this.accessCode = crypto.randomBytes(16).toString('hex');
    }
    this.updatedAt = Date.now();
    next();
});

// Check if access is valid
ShareAccessSchema.methods.isValidAccess = function() {
    if (!this.isActive) return false;
    if (this.expiresAt && new Date() > this.expiresAt) return false;
    if (this.maxAccesses && this.timesAccessed >= this.maxAccesses) return false;
    if (this.type === 'doctor-account' && this.status !== 'approved') return false;
    return true;
};

// Log access
ShareAccessSchema.methods.logAccess = function(accessInfo) {
    this.accessLog.push(accessInfo);
    this.timesAccessed += 1;
    this.lastAccessedAt = new Date();
    return this.save();
};

ShareAccessSchema.index({ patientId: 1, isActive: 1 });
ShareAccessSchema.index({ doctorId: 1, status: 1 });
ShareAccessSchema.index({ accessCode: 1 });

module.exports = mongoose.model('ShareAccess', ShareAccessSchema);
