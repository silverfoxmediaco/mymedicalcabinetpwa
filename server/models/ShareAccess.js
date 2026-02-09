const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ShareAccessSchema = new mongoose.Schema({
    // Patient who is sharing
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Family member whose records are being shared (null = primary user)
    familyMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        default: null
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
    // For email-otp sharing
    recipientEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    recipientName: {
        type: String,
        trim: true
    },
    otpHash: {
        type: String,
        select: false
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpLockedUntil: {
        type: Date
    },
    otpVerified: {
        type: Boolean,
        default: false
    },
    sessionToken: {
        type: String
    },
    sessionExpiresAt: {
        type: Date
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
        enum: ['qr-code', 'doctor-account', 'temporary-link', 'email-otp'],
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
    if (!this.accessCode && (this.type === 'qr-code' || this.type === 'email-otp')) {
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

// Set OTP (hash it before storing)
ShareAccessSchema.methods.setOtp = async function(otp) {
    const salt = await bcrypt.genSalt(10);
    this.otpHash = await bcrypt.hash(otp.toString(), salt);
    return this.save();
};

// Verify OTP
ShareAccessSchema.methods.verifyOtp = async function(candidateOtp) {
    // Check if locked
    if (this.otpLockedUntil && this.otpLockedUntil > Date.now()) {
        const lockRemaining = Math.ceil((this.otpLockedUntil - Date.now()) / 60000);
        throw new Error(`Too many failed attempts. Try again in ${lockRemaining} minutes.`);
    }

    // Get the hash (need to explicitly select it since it's not included by default)
    const shareWithHash = await this.constructor.findById(this._id).select('+otpHash');

    if (!shareWithHash.otpHash) {
        throw new Error('OTP not set for this share');
    }

    const isMatch = await bcrypt.compare(candidateOtp.toString(), shareWithHash.otpHash);

    if (!isMatch) {
        this.otpAttempts += 1;

        // Lock after 5 failed attempts for 30 minutes
        if (this.otpAttempts >= 5) {
            this.otpLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        }

        await this.save();

        const remaining = 5 - this.otpAttempts;
        if (remaining > 0) {
            throw new Error(`Invalid verification code. ${remaining} attempts remaining.`);
        } else {
            throw new Error('Too many failed attempts. Please wait 30 minutes before trying again.');
        }
    }

    // Success - mark as verified and reset attempts
    this.otpVerified = true;
    this.otpAttempts = 0;
    this.otpLockedUntil = null;
    await this.save();

    return true;
};

// Generate session token after OTP verification
ShareAccessSchema.methods.generateSessionToken = async function() {
    this.sessionToken = crypto.randomBytes(32).toString('hex');
    this.sessionExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.save();
    return this.sessionToken;
};

// Validate session token
ShareAccessSchema.methods.validateSession = function(token) {
    if (!this.sessionToken || this.sessionToken !== token) {
        return false;
    }
    if (this.sessionExpiresAt && new Date() > this.sessionExpiresAt) {
        return false;
    }
    return true;
};

ShareAccessSchema.index({ patientId: 1, isActive: 1 });
ShareAccessSchema.index({ recipientEmail: 1 });
ShareAccessSchema.index({ sessionToken: 1 });
ShareAccessSchema.index({ doctorId: 1, status: 1 });
ShareAccessSchema.index({ accessCode: 1 });

module.exports = mongoose.model('ShareAccess', ShareAccessSchema);
