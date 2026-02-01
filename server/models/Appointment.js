const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    title: {
        type: String,
        required: [true, 'Appointment title is required']
    },
    doctorName: {
        type: String,
        required: [true, 'Doctor name is required']
    },
    specialty: {
        type: String
    },
    location: {
        name: String,
        address: String,
        phone: String
    },
    dateTime: {
        type: Date,
        required: [true, 'Appointment date and time is required']
    },
    duration: {
        type: Number,
        default: 30 // minutes
    },
    type: {
        type: String,
        enum: ['checkup', 'follow-up', 'consultation', 'procedure', 'lab-work', 'imaging', 'vaccination', 'physical', 'specialist', 'therapy', 'dental', 'vision', 'other'],
        default: 'checkup'
    },
    reason: {
        type: String
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    notes: {
        type: String
    },
    visitSummary: {
        type: String
    },
    // Google Calendar sync
    googleCalendarEventId: {
        type: String
    },
    calendarSynced: {
        type: Boolean,
        default: false
    },
    // Reminders
    reminders: {
        push: {
            enabled: {
                type: Boolean,
                default: true
            },
            timing: [{
                type: Number, // minutes before appointment
                default: [1440, 60] // 24 hours and 1 hour before
            }]
        },
        email: {
            enabled: {
                type: Boolean,
                default: true
            },
            timing: [{
                type: Number,
                default: [1440] // 24 hours before
            }]
        }
    },
    remindersSent: [{
        type: {
            type: String,
            enum: ['push', 'email']
        },
        sentAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

AppointmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for queries
AppointmentSchema.index({ userId: 1, dateTime: 1 });
AppointmentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
