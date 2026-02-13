const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SettlementOfferSchema = new mongoose.Schema({
    billId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalBill',
        required: true
    },
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
    billerEmail: {
        type: String,
        required: [true, 'Biller email is required'],
        lowercase: true,
        trim: true
    },
    billerName: {
        type: String,
        required: [true, 'Biller name is required'],
        trim: true
    },
    billerStripeAccountId: {
        type: String
    },
    // OTP fields (same pattern as ShareAccess)
    accessCode: {
        type: String,
        unique: true,
        sparse: true
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
    // State machine status
    status: {
        type: String,
        enum: [
            'pending_biller',
            'countered',
            'accepted',
            'payment_pending',
            'payment_processing',
            'paid',
            'payment_failed',
            'rejected',
            'expired',
            'withdrawn'
        ],
        default: 'pending_biller'
    },
    // Amounts
    originalBillAmount: {
        type: Number,
        required: true
    },
    offerAmount: {
        type: Number,
        required: true
    },
    counterAmount: {
        type: Number
    },
    finalAmount: {
        type: Number
    },
    // Audit trail
    history: [{
        action: {
            type: String,
            required: true
        },
        actor: {
            type: String,
            enum: ['patient', 'biller', 'system'],
            required: true
        },
        amount: Number,
        note: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // Stripe fields
    stripePaymentIntentId: {
        type: String
    },
    stripeTransferId: {
        type: String
    },
    platformFee: {
        type: Number
    },
    // Messages
    patientMessage: {
        type: String,
        trim: true
    },
    billerMessage: {
        type: String,
        trim: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
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

// Generate access code before saving
SettlementOfferSchema.pre('save', function(next) {
    if (!this.accessCode) {
        this.accessCode = crypto.randomBytes(16).toString('hex');
    }
    this.updatedAt = Date.now();
    next();
});

// Set OTP (hash it before storing)
SettlementOfferSchema.methods.setOtp = async function(otp) {
    const salt = await bcrypt.genSalt(10);
    this.otpHash = await bcrypt.hash(otp.toString(), salt);
    return this.save();
};

// Verify OTP
SettlementOfferSchema.methods.verifyOtp = async function(candidateOtp) {
    if (this.otpLockedUntil && this.otpLockedUntil > Date.now()) {
        const lockRemaining = Math.ceil((this.otpLockedUntil - Date.now()) / 60000);
        throw new Error(`Too many failed attempts. Try again in ${lockRemaining} minutes.`);
    }

    const offerWithHash = await this.constructor.findById(this._id).select('+otpHash');

    if (!offerWithHash.otpHash) {
        throw new Error('OTP not set for this offer');
    }

    const isMatch = await bcrypt.compare(candidateOtp.toString(), offerWithHash.otpHash);

    if (!isMatch) {
        this.otpAttempts += 1;

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

    this.otpVerified = true;
    this.otpAttempts = 0;
    this.otpLockedUntil = null;
    await this.save();

    return true;
};

// Generate session token after OTP verification
SettlementOfferSchema.methods.generateSessionToken = async function() {
    this.sessionToken = crypto.randomBytes(32).toString('hex');
    this.sessionExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.save();
    return this.sessionToken;
};

// Validate session token
SettlementOfferSchema.methods.validateSession = function(token) {
    if (!this.sessionToken || this.sessionToken !== token) {
        return false;
    }
    if (this.sessionExpiresAt && new Date() > this.sessionExpiresAt) {
        return false;
    }
    return true;
};

// Add history entry
SettlementOfferSchema.methods.addHistory = function(action, actor, amount, note) {
    this.history.push({ action, actor, amount, note });
};

SettlementOfferSchema.index({ billId: 1, status: 1 });
SettlementOfferSchema.index({ accessCode: 1 });
SettlementOfferSchema.index({ billerEmail: 1 });
SettlementOfferSchema.index({ expiresAt: 1 });
SettlementOfferSchema.index({ userId: 1 });

module.exports = mongoose.model('SettlementOffer', SettlementOfferSchema);
