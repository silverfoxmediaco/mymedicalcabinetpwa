const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: [true, 'Medication name is required'],
        trim: true
    },
    genericName: {
        type: String,
        trim: true
    },
    dosage: {
        amount: String,
        unit: {
            type: String,
            enum: ['mg', 'mcg', 'g', 'ml', 'units', 'other'],
            default: 'mg'
        }
    },
    frequency: {
        type: String,
        enum: ['once daily', 'twice daily', 'three times daily', 'four times daily', 'as needed', 'weekly', 'other'],
        default: 'once daily'
    },
    timeOfDay: [{
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'bedtime', 'with meals']
    }],
    prescribedBy: {
        type: String
    },
    prescribedDate: {
        type: Date
    },
    pharmacy: {
        name: String,
        phone: String,
        address: String
    },
    refillsRemaining: {
        type: Number,
        default: 0
    },
    nextRefillDate: {
        type: Date
    },
    purpose: {
        type: String
    },
    sideEffects: {
        type: String
    },
    instructions: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'discontinued', 'completed'],
        default: 'active'
    },
    scannedData: {
        ndcCode: String,
        manufacturer: String,
        scannedAt: Date,
        rawText: String
    },
    // FHIR sync tracking
    fhirSource: {
        synced: { type: Boolean, default: false },
        provider: String,  // 'wellmark', etc.
        resourceId: String, // FHIR resource ID for deduplication
        lastSynced: Date
    },
    reminderEnabled: {
        type: Boolean,
        default: false
    },
    reminderTimes: [{
        type: String
    }],
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    sourceAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    createdByEventId: { type: mongoose.Schema.Types.ObjectId },
    prescribingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

MedicationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for searching medications
MedicationSchema.index({ userId: 1, status: 1 });
MedicationSchema.index({ name: 'text', genericName: 'text' });

module.exports = mongoose.model('Medication', MedicationSchema);
