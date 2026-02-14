const mongoose = require('mongoose');

const FamilyMemberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    relationship: {
        type: String,
        enum: ['spouse', 'child', 'parent', 'sibling', 'other'],
        required: [true, 'Relationship is required']
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'],
    },
    ssnLast4: {
        type: String,
        trim: true,
        minlength: 4,
        maxlength: 4
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    race: {
        type: String,
        trim: true
    },
    ethnicity: {
        type: String,
        trim: true
    },
    maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed', 'separated', 'domestic-partner'],
        trim: true
    },
    occupation: {
        type: String,
        trim: true
    },
    employer: {
        type: String,
        trim: true
    },
    preferredLanguage: {
        type: String,
        trim: true,
        default: 'English'
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
    profileImage: {
        type: String
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

FamilyMemberSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

FamilyMemberSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('FamilyMember', FamilyMemberSchema);
