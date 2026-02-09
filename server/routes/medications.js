const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Medication = require('../models/Medication');
const { protect } = require('../middleware/auth');
const { getFamilyMemberFilter } = require('../middleware/familyMemberScope');

// @route   GET /api/medications
// @desc    Get all medications for user (or family member)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, familyMemberId } = req.query;
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const query = { userId: req.user._id, ...familyFilter };

        if (status) {
            query.status = status;
        }

        const medications = await Medication.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: medications.length,
            data: medications
        });
    } catch (error) {
        console.error('Get medications error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error fetching medications'
        });
    }
});

// @route   GET /api/medications/:id
// @desc    Get single medication
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const medication = await Medication.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }

        res.json({
            success: true,
            data: medication
        });
    } catch (error) {
        console.error('Get medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medication'
        });
    }
});

// @route   POST /api/medications
// @desc    Add a medication
// @access  Private
router.post('/', protect, [
    body('name').notEmpty().withMessage('Medication name is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const familyFilter = await getFamilyMemberFilter(req.user._id, req.body.familyMemberId);
        const medication = await Medication.create({
            ...req.body,
            userId: req.user._id,
            ...familyFilter
        });

        res.status(201).json({
            success: true,
            message: 'Medication added',
            data: medication
        });
    } catch (error) {
        console.error('Add medication error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error adding medication'
        });
    }
});

// @route   POST /api/medications/scan
// @desc    Add medication from scanned data
// @access  Private
router.post('/scan', protect, async (req, res) => {
    const { scannedText, ndcCode } = req.body;

    try {
        const familyFilter = await getFamilyMemberFilter(req.user._id, req.body.familyMemberId);
        // Parse scanned data - this would be enhanced with actual OCR processing
        const medication = await Medication.create({
            userId: req.user._id,
            ...familyFilter,
            name: req.body.name || 'Scanned Medication',
            genericName: req.body.genericName,
            dosage: req.body.dosage,
            scannedData: {
                ndcCode,
                rawText: scannedText,
                scannedAt: new Date()
            }
        });

        res.status(201).json({
            success: true,
            message: 'Medication scanned and added',
            data: medication
        });
    } catch (error) {
        console.error('Scan medication error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error processing scanned medication'
        });
    }
});

// @route   PUT /api/medications/:id
// @desc    Update a medication
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let medication = await Medication.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }

        medication = await Medication.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Medication updated',
            data: medication
        });
    } catch (error) {
        console.error('Update medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating medication'
        });
    }
});

// @route   PUT /api/medications/:id/status
// @desc    Update medication status (active/discontinued)
// @access  Private
router.put('/:id/status', protect, [
    body('status').isIn(['active', 'discontinued', 'completed']).withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const medication = await Medication.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            {
                status: req.body.status,
                endDate: req.body.status !== 'active' ? new Date() : undefined
            },
            { new: true }
        );

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }

        res.json({
            success: true,
            message: 'Medication status updated',
            data: medication
        });
    } catch (error) {
        console.error('Update medication status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating medication status'
        });
    }
});

// @route   PUT /api/medications/:id/reminder
// @desc    Toggle medication reminder
// @access  Private
router.put('/:id/reminder', protect, async (req, res) => {
    const { enabled, times } = req.body;

    try {
        const medication = await Medication.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            {
                reminderEnabled: enabled,
                reminderTimes: times || []
            },
            { new: true }
        );

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }

        res.json({
            success: true,
            message: enabled ? 'Reminder enabled' : 'Reminder disabled',
            data: medication
        });
    } catch (error) {
        console.error('Update reminder error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating reminder'
        });
    }
});

// @route   DELETE /api/medications/:id
// @desc    Delete a medication
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const medication = await Medication.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found'
            });
        }

        res.json({
            success: true,
            message: 'Medication deleted'
        });
    } catch (error) {
        console.error('Delete medication error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting medication'
        });
    }
});

module.exports = router;
