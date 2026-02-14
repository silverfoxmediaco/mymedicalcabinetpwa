const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FamilyMember = require('../models/FamilyMember');
const MedicalHistory = require('../models/MedicalHistory');
const Medication = require('../models/Medication');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Insurance = require('../models/Insurance');
const { protect } = require('../middleware/auth');

const MAX_FAMILY_MEMBERS = 10;

// @route   GET /api/family-members
// @desc    Get all family members for user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const familyMembers = await FamilyMember.find({
            userId: req.user._id,
            isActive: true
        }).sort({ createdAt: 1 });

        res.json({
            success: true,
            count: familyMembers.length,
            data: familyMembers
        });
    } catch (error) {
        console.error('Get family members error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching family members'
        });
    }
});

// @route   GET /api/family-members/:id
// @desc    Get single family member
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const familyMember = await FamilyMember.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        res.json({
            success: true,
            data: familyMember
        });
    } catch (error) {
        console.error('Get family member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching family member'
        });
    }
});

// @route   POST /api/family-members
// @desc    Add a family member
// @access  Private
router.post('/', protect, [
    body('firstName').notEmpty().withMessage('First name is required').trim(),
    body('relationship').isIn(['spouse', 'child', 'parent', 'sibling', 'other'])
        .withMessage('Valid relationship is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        // Check member limit
        const existingCount = await FamilyMember.countDocuments({
            userId: req.user._id,
            isActive: true
        });

        if (existingCount >= MAX_FAMILY_MEMBERS) {
            return res.status(400).json({
                success: false,
                message: `Maximum of ${MAX_FAMILY_MEMBERS} family members allowed`
            });
        }

        const familyMember = await FamilyMember.create({
            ...req.body,
            userId: req.user._id
        });

        // Auto-create a MedicalHistory doc for this family member
        await MedicalHistory.create({
            userId: req.user._id,
            familyMemberId: familyMember._id
        });

        res.status(201).json({
            success: true,
            message: 'Family member added',
            data: familyMember
        });
    } catch (error) {
        console.error('Add family member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding family member'
        });
    }
});

// @route   PUT /api/family-members/:id
// @desc    Update a family member
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let familyMember = await FamilyMember.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        const allowedUpdates = [
            'firstName', 'lastName', 'relationship', 'dateOfBirth', 'gender',
            'ssnLast4', 'phone', 'email', 'race', 'ethnicity', 'maritalStatus',
            'occupation', 'employer', 'preferredLanguage', 'address',
            'emergencyContact', 'profileImage'
        ];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        familyMember = await FamilyMember.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Family member updated',
            data: familyMember
        });
    } catch (error) {
        console.error('Update family member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating family member'
        });
    }
});

// @route   DELETE /api/family-members/:id
// @desc    Delete a family member and cascade delete all associated data
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const familyMember = await FamilyMember.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        // Cascade delete all associated data
        await Promise.all([
            Medication.deleteMany({ userId: req.user._id, familyMemberId: req.params.id }),
            Doctor.deleteMany({ patientId: req.user._id, familyMemberId: req.params.id }),
            Appointment.deleteMany({ userId: req.user._id, familyMemberId: req.params.id }),
            Insurance.deleteMany({ userId: req.user._id, familyMemberId: req.params.id }),
            MedicalHistory.deleteMany({ userId: req.user._id, familyMemberId: req.params.id })
        ]);

        await FamilyMember.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Family member and all associated data deleted'
        });
    } catch (error) {
        console.error('Delete family member error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting family member'
        });
    }
});

// =====================
// FAMILY MEMBER PHARMACY ROUTES
// =====================

// @route   POST /api/family-members/:id/pharmacies
// @desc    Add pharmacy to family member
// @access  Private
router.post('/:id/pharmacies', protect, async (req, res) => {
    try {
        const familyMember = await FamilyMember.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        if (!req.body.name) {
            return res.status(400).json({
                success: false,
                message: 'Pharmacy name is required'
            });
        }

        // If this pharmacy is set as preferred, unset others
        if (req.body.isPreferred) {
            familyMember.pharmacies.forEach(p => p.isPreferred = false);
        }

        familyMember.pharmacies.push(req.body);
        await familyMember.save();

        const newPharmacy = familyMember.pharmacies[familyMember.pharmacies.length - 1];

        res.status(201).json({
            success: true,
            pharmacy: newPharmacy
        });
    } catch (error) {
        console.error('Add family member pharmacy error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding pharmacy'
        });
    }
});

// @route   PUT /api/family-members/:id/pharmacies/:pharmacyId
// @desc    Update a family member's pharmacy
// @access  Private
router.put('/:id/pharmacies/:pharmacyId', protect, async (req, res) => {
    try {
        const familyMember = await FamilyMember.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        const pharmacy = familyMember.pharmacies.id(req.params.pharmacyId);
        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        // If this pharmacy is set as preferred, unset others
        if (req.body.isPreferred) {
            familyMember.pharmacies.forEach(p => {
                if (p._id.toString() !== req.params.pharmacyId) {
                    p.isPreferred = false;
                }
            });
        }

        Object.keys(req.body).forEach(key => {
            pharmacy[key] = req.body[key];
        });

        await familyMember.save();

        res.json({
            success: true,
            pharmacy
        });
    } catch (error) {
        console.error('Update family member pharmacy error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating pharmacy'
        });
    }
});

// @route   DELETE /api/family-members/:id/pharmacies/:pharmacyId
// @desc    Delete a family member's pharmacy
// @access  Private
router.delete('/:id/pharmacies/:pharmacyId', protect, async (req, res) => {
    try {
        const familyMember = await FamilyMember.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!familyMember) {
            return res.status(404).json({
                success: false,
                message: 'Family member not found'
            });
        }

        const pharmacy = familyMember.pharmacies.id(req.params.pharmacyId);
        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        pharmacy.deleteOne();
        await familyMember.save();

        res.json({
            success: true,
            message: 'Pharmacy deleted'
        });
    } catch (error) {
        console.error('Delete family member pharmacy error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting pharmacy'
        });
    }
});

module.exports = router;
