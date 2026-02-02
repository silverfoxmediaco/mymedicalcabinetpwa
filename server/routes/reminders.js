const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const reminderService = require('../services/reminderService');

// @route   POST /api/reminders/process
// @desc    Manually trigger reminder processing (for testing or manual runs)
// @access  Private (would typically be admin only or called by cron)
router.post('/process', protect, async (req, res) => {
    try {
        const results = await reminderService.processAllReminders();

        res.json({
            success: true,
            message: 'Reminder processing completed',
            results
        });
    } catch (error) {
        console.error('Reminder processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing reminders'
        });
    }
});

// @route   POST /api/reminders/medications
// @desc    Process medication reminders only
// @access  Private
router.post('/medications', protect, async (req, res) => {
    try {
        const results = await reminderService.processMedicationReminders();

        res.json({
            success: true,
            message: 'Medication reminders processed',
            results
        });
    } catch (error) {
        console.error('Medication reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing medication reminders'
        });
    }
});

// @route   POST /api/reminders/appointments
// @desc    Process appointment reminders only
// @access  Private
router.post('/appointments', protect, async (req, res) => {
    try {
        const results = await reminderService.processAppointmentReminders();

        res.json({
            success: true,
            message: 'Appointment reminders processed',
            results
        });
    } catch (error) {
        console.error('Appointment reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing appointment reminders'
        });
    }
});

// @route   POST /api/reminders/refills
// @desc    Process refill reminders only
// @access  Private
router.post('/refills', protect, async (req, res) => {
    try {
        const results = await reminderService.processRefillReminders();

        res.json({
            success: true,
            message: 'Refill reminders processed',
            results
        });
    } catch (error) {
        console.error('Refill reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing refill reminders'
        });
    }
});

module.exports = router;
