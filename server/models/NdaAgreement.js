const mongoose = require('mongoose');

const ndaAgreementSchema = new mongoose.Schema({
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
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    agreedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

ndaAgreementSchema.index({ email: 1 });

module.exports = mongoose.model('NdaAgreement', ndaAgreementSchema);
