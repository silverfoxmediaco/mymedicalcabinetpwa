const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId && !this.appleId;
        },
        minlength: 6,
        select: false
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    phone: {
        type: String,
        trim: true
    },
    backupEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    ssnLast4: {
        type: String,
        trim: true,
        minlength: 4,
        maxlength: 4
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    // User's saved pharmacies
    pharmacies: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        fax: {
            type: String,
            trim: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String
        },
        isPreferred: {
            type: Boolean,
            default: false
        }
    }],
    role: {
        type: String,
        enum: ['patient', 'caregiver', 'doctor'],
        default: 'patient'
    },
    googleId: {
        type: String,
        sparse: true
    },
    appleId: {
        type: String,
        sparse: true
    },
    profileImage: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpires: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    // User preferences
    preferredCalendar: {
        type: String,
        enum: ['google', 'apple', 'outlook_web', 'outlook_desktop', 'yahoo', 'ics'],
        default: null
    },
    // Legal consent tracking
    consent: {
        hasAcceptedTerms: {
            type: Boolean,
            default: false
        },
        termsAcceptedAt: {
            type: Date
        },
        termsVersion: {
            type: String
        },
        hasAcceptedPrivacy: {
            type: Boolean,
            default: false
        },
        privacyAcceptedAt: {
            type: Date
        },
        privacyVersion: {
            type: String
        },
        hasAcceptedHipaa: {
            type: Boolean,
            default: false
        },
        hipaaAcceptedAt: {
            type: Date
        },
        hipaaVersion: {
            type: String
        },
        ipAddress: {
            type: String
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

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Update timestamp on save
UserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name
UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', UserSchema);
