const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    // If this is a doctor account (role: doctor in User model)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    // If this is a patient's doctor entry (their healthcare provider)
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    name: {
        type: String,
        required: [true, 'Doctor name is required'],
        trim: true
    },
    specialty: {
        type: String,
        trim: true
    },
    practice: {
        name: String,
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String
        }
    },
    phone: {
        type: String,
        trim: true
    },
    fax: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    npiNumber: {
        type: String,
        trim: true
    },
    isPrimaryCare: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
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

DoctorSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for searching
DoctorSchema.index({ patientId: 1 });
DoctorSchema.index({ name: 'text', specialty: 'text' });

module.exports = mongoose.model('Doctor', DoctorSchema);
