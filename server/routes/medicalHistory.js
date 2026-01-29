const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const MedicalHistory = require('../models/MedicalHistory');
const { protect } = require('../middleware/auth');

// @route   GET /api/medical-history
// @desc    Get user's medical history
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let history = await MedicalHistory.findOne({ userId: req.user._id });

        if (!history) {
            history = await MedicalHistory.create({ userId: req.user._id });
        }

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get medical history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medical history'
        });
    }
});

// @route   PUT /api/medical-history/vitals
// @desc    Update vitals (blood type, height, weight)
// @access  Private
router.put('/vitals', protect, async (req, res) => {
    const { bloodType, height, weight } = req.body;

    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { bloodType, height, weight },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Vitals updated',
            data: history
        });
    } catch (error) {
        console.error('Update vitals error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating vitals'
        });
    }
});

// @route   POST /api/medical-history/conditions
// @desc    Add a condition
// @access  Private
router.post('/conditions', protect, [
    body('name').notEmpty().withMessage('Condition name is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $push: { conditions: req.body } },
            { new: true, upsert: true }
        );

        res.status(201).json({
            success: true,
            message: 'Condition added',
            data: history.conditions
        });
    } catch (error) {
        console.error('Add condition error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding condition'
        });
    }
});

// @route   DELETE /api/medical-history/conditions/:conditionId
// @desc    Remove a condition
// @access  Private
router.delete('/conditions/:conditionId', protect, async (req, res) => {
    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $pull: { conditions: { _id: req.params.conditionId } } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Condition removed',
            data: history.conditions
        });
    } catch (error) {
        console.error('Remove condition error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing condition'
        });
    }
});

// @route   POST /api/medical-history/allergies
// @desc    Add an allergy
// @access  Private
router.post('/allergies', protect, [
    body('allergen').notEmpty().withMessage('Allergen is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $push: { allergies: req.body } },
            { new: true, upsert: true }
        );

        res.status(201).json({
            success: true,
            message: 'Allergy added',
            data: history.allergies
        });
    } catch (error) {
        console.error('Add allergy error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding allergy'
        });
    }
});

// @route   DELETE /api/medical-history/allergies/:allergyId
// @desc    Remove an allergy
// @access  Private
router.delete('/allergies/:allergyId', protect, async (req, res) => {
    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $pull: { allergies: { _id: req.params.allergyId } } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Allergy removed',
            data: history.allergies
        });
    } catch (error) {
        console.error('Remove allergy error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing allergy'
        });
    }
});

// @route   POST /api/medical-history/surgeries
// @desc    Add a surgery
// @access  Private
router.post('/surgeries', protect, [
    body('procedure').notEmpty().withMessage('Procedure name is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $push: { surgeries: req.body } },
            { new: true, upsert: true }
        );

        res.status(201).json({
            success: true,
            message: 'Surgery added',
            data: history.surgeries
        });
    } catch (error) {
        console.error('Add surgery error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding surgery'
        });
    }
});

// @route   DELETE /api/medical-history/surgeries/:surgeryId
// @desc    Remove a surgery
// @access  Private
router.delete('/surgeries/:surgeryId', protect, async (req, res) => {
    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $pull: { surgeries: { _id: req.params.surgeryId } } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Surgery removed',
            data: history.surgeries
        });
    } catch (error) {
        console.error('Remove surgery error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing surgery'
        });
    }
});

// @route   POST /api/medical-history/family-history
// @desc    Add family history
// @access  Private
router.post('/family-history', protect, [
    body('condition').notEmpty().withMessage('Condition is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $push: { familyHistory: req.body } },
            { new: true, upsert: true }
        );

        res.status(201).json({
            success: true,
            message: 'Family history added',
            data: history.familyHistory
        });
    } catch (error) {
        console.error('Add family history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding family history'
        });
    }
});

// @route   DELETE /api/medical-history/family-history/:historyId
// @desc    Remove family history
// @access  Private
router.delete('/family-history/:historyId', protect, async (req, res) => {
    try {
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $pull: { familyHistory: { _id: req.params.historyId } } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Family history removed',
            data: history.familyHistory
        });
    } catch (error) {
        console.error('Remove family history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing family history'
        });
    }
});

module.exports = router;
