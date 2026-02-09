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
        enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },
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
