const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const MedicalHistory = require('../models/MedicalHistory');
const Medication = require('../models/Medication');
const { protect } = require('../middleware/auth');
const { getFamilyMemberFilter } = require('../middleware/familyMemberScope');

// @route   GET /api/medical-history
// @desc    Get user's medical history
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { familyMemberId } = req.query;
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const query = { userId: req.user._id, ...familyFilter };

        let history = await MedicalHistory.findOne(query)
            .populate('events.prescribedMedications');

        if (!history) {
            history = await MedicalHistory.create(query);
        }

        res.json({
            success: true,
            medicalHistory: history
        });
    } catch (error) {
        console.error('Get medical history error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error fetching medical history'
        });
    }
});

// @route   PUT /api/medical-history/vitals
// @desc    Update vitals (blood type, height, weight)
// @access  Private
router.put('/vitals', protect, async (req, res) => {
    const { bloodType, height, weight, familyMemberId } = req.body;

    try {
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
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

// @route   PUT /api/medical-history/past-medical-checklist
// @desc    Update past medical history checklist
// @access  Private
router.put('/past-medical-checklist', protect, async (req, res) => {
    const { familyMemberId, ...checklistData } = req.body;

    try {
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
            { pastMedicalChecklist: checklistData },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Past medical checklist updated',
            medicalHistory: history
        });
    } catch (error) {
        console.error('Update past medical checklist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating past medical checklist'
        });
    }
});

// @route   PUT /api/medical-history/family-history-checklist
// @desc    Update family history checklist
// @access  Private
router.put('/family-history-checklist', protect, async (req, res) => {
    const { familyMemberId, ...checklistData } = req.body;

    try {
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
            { familyHistoryChecklist: checklistData },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Family history checklist updated',
            medicalHistory: history
        });
    } catch (error) {
        console.error('Update family history checklist error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating family history checklist'
        });
    }
});

// @route   PUT /api/medical-history/social-history
// @desc    Update social history
// @access  Private
router.put('/social-history', protect, async (req, res) => {
    const { familyMemberId, ...socialData } = req.body;

    try {
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
            { socialHistory: socialData },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'Social history updated',
            medicalHistory: history
        });
    } catch (error) {
        console.error('Update social history error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating social history'
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
        const familyFilter = await getFamilyMemberFilter(req.user._id, req.body.familyMemberId);
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
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
        const familyFilter = await getFamilyMemberFilter(req.user._id, req.body.familyMemberId);
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
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
        const familyFilter = await getFamilyMemberFilter(req.user._id, req.body.familyMemberId);
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
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
        const familyFilter = await getFamilyMemberFilter(req.user._id, req.body.familyMemberId);
        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
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

// @route   POST /api/medical-history/events
// @desc    Add a health event (with optional prescribed medications)
// @access  Private
router.post('/events', protect, [
    body('description').notEmpty().withMessage('Event description is required'),
    body('date').notEmpty().withMessage('Event date is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { prescriptions, familyMemberId, ...eventData } = req.body;
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);

        // Collect all medication IDs (existing refs + newly created)
        const allMedicationIds = [];
        const createdMedications = [];

        if (prescriptions && prescriptions.length > 0) {
            for (const rx of prescriptions) {
                // If referencing an existing medication from My Medications
                if (rx.existingMedicationId) {
                    const existingMed = await Medication.findOne({
                        _id: rx.existingMedicationId,
                        userId: req.user._id
                    });
                    if (existingMed) {
                        allMedicationIds.push(existingMed._id);
                    }
                    continue;
                }

                // Create new medication document
                if (!rx.medicationName || !rx.medicationName.trim()) continue;
                const medication = await Medication.create({
                    userId: req.user._id,
                    ...familyFilter,
                    name: rx.medicationName.trim(),
                    genericName: rx.genericName || '',
                    dosage: rx.dosage || { amount: '', unit: 'mg' },
                    frequency: rx.frequency || 'once daily',
                    purpose: rx.purpose || '',
                    instructions: rx.instructions || '',
                    prescribedDate: eventData.date,
                    prescribingDoctorId: eventData.doctorId || undefined,
                    status: 'active'
                });
                createdMedications.push(medication);
                allMedicationIds.push(medication._id);
            }
        }

        // Attach all medication IDs to event
        if (allMedicationIds.length > 0) {
            eventData.prescribedMedications = allMedicationIds;
        }

        const history = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id, ...familyFilter },
            { $push: { events: eventData } },
            { new: true, upsert: true }
        ).populate('events.prescribedMedications');

        // Stamp createdByEventId on newly created medications
        const newEvent = history.events[history.events.length - 1];
        if (createdMedications.length > 0 && newEvent) {
            await Medication.updateMany(
                { _id: { $in: createdMedications.map(m => m._id) } },
                { createdByEventId: newEvent._id }
            );
        }

        res.status(201).json({
            success: true,
            message: 'Event added',
            data: history.events,
            medications: createdMedications
        });
    } catch (error) {
        console.error('Add event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding event'
        });
    }
});

// @route   DELETE /api/medical-history/events/:eventId
// @desc    Remove a health event and its associated medications
// @access  Private
router.delete('/events/:eventId', protect, async (req, res) => {
    try {
        // Only cascade-delete medications that were created by this event
        // Pre-existing My Medications meds (no createdByEventId) are preserved
        const history = await MedicalHistory.findOne({ userId: req.user._id });
        if (history) {
            const event = history.events.id(req.params.eventId);
            if (event && event.prescribedMedications && event.prescribedMedications.length > 0) {
                await Medication.deleteMany({
                    _id: { $in: event.prescribedMedications },
                    userId: req.user._id,
                    createdByEventId: event._id
                });
            }
        }

        const updatedHistory = await MedicalHistory.findOneAndUpdate(
            { userId: req.user._id },
            { $pull: { events: { _id: req.params.eventId } } },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Event removed',
            data: updatedHistory.events
        });
    } catch (error) {
        console.error('Remove event error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing event'
        });
    }
});

module.exports = router;
