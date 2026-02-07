const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Medication = require('../models/Medication');
const MedicalHistory = require('../models/MedicalHistory');
const { protect } = require('../middleware/auth');

// Helper function to map appointment types to event types
const mapAppointmentTypeToEventType = (appointmentType) => {
    const mapping = {
        'checkup': 'checkup',
        'follow-up': 'checkup',
        'consultation': 'specialist',
        'procedure': 'procedure',
        'lab-work': 'lab_work',
        'imaging': 'imaging',
        'vaccination': 'vaccination',
        'physical': 'physical',
        'specialist': 'specialist',
        'therapy': 'therapy',
        'dental': 'other',
        'vision': 'other',
        'other': 'other'
    };
    return mapping[appointmentType] || 'other';
};

// @route   GET /api/appointments
// @desc    Get all appointments for user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, upcoming } = req.query;
        const query = { userId: req.user._id };

        if (status) {
            query.status = status;
        }

        if (upcoming === 'true') {
            query.dateTime = { $gte: new Date() };
            query.status = { $in: ['scheduled', 'confirmed'] };
        }

        const appointments = await Appointment.find(query)
            .sort({ dateTime: upcoming === 'true' ? 1 : -1 })
            .populate('doctorId', 'name specialty');

        res.json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointments'
        });
    }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('doctorId', 'name specialty phone practice');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            data: appointment
        });
    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointment'
        });
    }
});

// @route   POST /api/appointments
// @desc    Create an appointment
// @access  Private
router.post('/', protect, [
    body('doctorName').notEmpty().withMessage('Doctor name is required'),
    body('dateTime').isISO8601().withMessage('Valid date and time is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const appointment = await Appointment.create({
            ...req.body,
            userId: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Appointment created',
            data: appointment
        });
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating appointment'
        });
    }
});

// @route   PUT /api/appointments/:id
// @desc    Update an appointment
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let appointment = await Appointment.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Appointment updated',
            data: appointment
        });
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating appointment'
        });
    }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.put('/:id/status', protect, [
    body('status').isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'])
        .withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { status: req.body.status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            message: 'Appointment status updated',
            data: appointment
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating appointment status'
        });
    }
});

// @route   PUT /api/appointments/:id/summary
// @desc    Add visit summary after appointment
// @access  Private
router.put('/:id/summary', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            {
                visitSummary: req.body.visitSummary,
                notes: req.body.notes,
                status: 'completed'
            },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            message: 'Visit summary added',
            data: appointment
        });
    } catch (error) {
        console.error('Add summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding visit summary'
        });
    }
});

// @route   PUT /api/appointments/:id/reminders
// @desc    Update appointment reminders
// @access  Private
router.put('/:id/reminders', protect, async (req, res) => {
    const { push, email } = req.body;

    try {
        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { reminders: { push, email } },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            message: 'Reminders updated',
            data: appointment
        });
    } catch (error) {
        console.error('Update reminders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating reminders'
        });
    }
});

// @route   POST /api/appointments/:id/sync-calendar
// @desc    Sync appointment with Google Calendar
// @access  Private
router.post('/:id/sync-calendar', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // TODO: Implement Google Calendar API integration
        // This would create/update a calendar event and store the eventId

        res.json({
            success: true,
            message: 'Calendar sync initiated',
            data: {
                appointmentId: appointment._id,
                calendarSynced: false,
                note: 'Google Calendar integration pending setup'
            }
        });
    } catch (error) {
        console.error('Sync calendar error:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing with calendar'
        });
    }
});

// @route   PUT /api/appointments/:id/complete
// @desc    Complete an appointment with visit summary, notes, and prescriptions
// @access  Private
router.put('/:id/complete', protect, async (req, res) => {
    try {
        const { visitSummary, notes, prescriptions } = req.body;

        // Find the appointment
        let appointment = await Appointment.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Create medications for each prescription
        const createdMedications = [];
        if (prescriptions && prescriptions.length > 0) {
            for (const prescription of prescriptions) {
                const medication = await Medication.create({
                    userId: req.user._id,
                    name: prescription.medicationName,
                    dosage: prescription.dosage,
                    frequency: prescription.frequency,
                    instructions: prescription.instructions,
                    prescribedBy: appointment.doctorName,
                    prescribedDate: appointment.dateTime,
                    status: 'active',
                    sourceAppointmentId: appointment._id,
                    prescribingDoctorId: appointment.doctorId
                });
                createdMedications.push(medication);
            }
        }

        // Get or create medical history for user
        let medicalHistory = await MedicalHistory.findOne({ userId: req.user._id });
        if (!medicalHistory) {
            medicalHistory = await MedicalHistory.create({ userId: req.user._id });
        }

        // Create event in medical history
        const newEvent = {
            description: visitSummary,
            eventType: mapAppointmentTypeToEventType(appointment.type),
            date: appointment.dateTime,
            provider: appointment.location?.name || appointment.doctorName,
            providerAddress: appointment.location?.address || '',
            providerPhone: appointment.location?.phone || '',
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName,
            appointmentId: appointment._id,
            prescribedMedications: createdMedications.map(m => m._id),
            notes: notes || ''
        };

        medicalHistory.events.push(newEvent);
        await medicalHistory.save();

        // Get the created event ID
        const createdEvent = medicalHistory.events[medicalHistory.events.length - 1];

        // Update prescriptions with medication IDs
        const updatedPrescriptions = prescriptions ? prescriptions.map((prescription, index) => ({
            ...prescription,
            medicationId: createdMedications[index]?._id
        })) : [];

        // Update appointment
        appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                status: 'completed',
                visitSummary,
                notes,
                prescriptions: updatedPrescriptions,
                generatedEventId: createdEvent._id
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Appointment completed successfully',
            data: {
                appointment,
                event: createdEvent,
                medications: createdMedications
            }
        });
    } catch (error) {
        console.error('Complete appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing appointment'
        });
    }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete an appointment
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const appointment = await Appointment.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // TODO: If synced to Google Calendar, delete the calendar event too

        res.json({
            success: true,
            message: 'Appointment deleted'
        });
    } catch (error) {
        console.error('Delete appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting appointment'
        });
    }
});

module.exports = router;
