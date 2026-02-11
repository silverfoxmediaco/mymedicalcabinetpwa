const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().trim(),
    body('backupEmail').optional({ checkFalsy: true }).isEmail().withMessage('Invalid backup email format'),
    body('dateOfBirth').optional({ checkFalsy: true }).isDate().withMessage('Invalid date format'),
    body('ssnLast4').optional({ checkFalsy: true }).isLength({ min: 4, max: 4 }).isNumeric().withMessage('SSN must be exactly 4 digits')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const allowedUpdates = [
        'firstName', 'lastName', 'phone', 'backupEmail', 'dateOfBirth',
        'address', 'emergencyContact', 'profileImage', 'ssnLast4', 'preferredCalendar',
        'gender', 'preferredLanguage', 'race', 'ethnicity',
        'maritalStatus', 'occupation', 'employer',
        'advanceDirectives'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    });

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

// @route   PUT /api/users/password
// @desc    Update password
// @access  Private
router.put('/password', protect, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id).select('+password');

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating password'
        });
    }
});

// @route   DELETE /api/users/account
// @desc    Permanently delete user account and all associated data
// @access  Private
router.delete('/account', protect, async (req, res) => {
    const Medication = require('../models/Medication');
    const Doctor = require('../models/Doctor');
    const Appointment = require('../models/Appointment');
    const Insurance = require('../models/Insurance');
    const MedicalHistory = require('../models/MedicalHistory');
    const ShareAccess = require('../models/ShareAccess');

    try {
        const userId = req.user._id;

        // Delete all user data in parallel
        await Promise.all([
            Medication.deleteMany({ userId }),
            Doctor.deleteMany({ userId }),
            Appointment.deleteMany({ userId }),
            Insurance.deleteMany({ userId }),
            MedicalHistory.deleteMany({ userId }),
            ShareAccess.deleteMany({ userId }),
            User.findByIdAndDelete(userId)
        ]);

        res.json({
            success: true,
            message: 'Account and all data permanently deleted'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting account'
        });
    }
});

// =====================
// PHARMACY ROUTES
// =====================

// @route   GET /api/users/pharmacies
// @desc    Get user's saved pharmacies
// @access  Private
router.get('/pharmacies', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('pharmacies');
        res.json({
            success: true,
            pharmacies: user.pharmacies || []
        });
    } catch (error) {
        console.error('Get pharmacies error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pharmacies'
        });
    }
});

// @route   POST /api/users/pharmacies
// @desc    Add a pharmacy
// @access  Private
router.post('/pharmacies', protect, [
    body('name').notEmpty().withMessage('Pharmacy name is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const user = await User.findById(req.user._id);

        // If this pharmacy is set as preferred, unset others
        if (req.body.isPreferred) {
            user.pharmacies.forEach(p => p.isPreferred = false);
        }

        user.pharmacies.push(req.body);
        await user.save();

        const newPharmacy = user.pharmacies[user.pharmacies.length - 1];

        res.status(201).json({
            success: true,
            pharmacy: newPharmacy
        });
    } catch (error) {
        console.error('Add pharmacy error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding pharmacy'
        });
    }
});

// @route   PUT /api/users/pharmacies/:id
// @desc    Update a pharmacy
// @access  Private
router.put('/pharmacies/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const pharmacy = user.pharmacies.id(req.params.id);

        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        // If this pharmacy is set as preferred, unset others
        if (req.body.isPreferred) {
            user.pharmacies.forEach(p => {
                if (p._id.toString() !== req.params.id) {
                    p.isPreferred = false;
                }
            });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            pharmacy[key] = req.body[key];
        });

        await user.save();

        res.json({
            success: true,
            pharmacy
        });
    } catch (error) {
        console.error('Update pharmacy error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating pharmacy'
        });
    }
});

// @route   DELETE /api/users/pharmacies/:id
// @desc    Delete a pharmacy
// @access  Private
router.delete('/pharmacies/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const pharmacy = user.pharmacies.id(req.params.id);

        if (!pharmacy) {
            return res.status(404).json({
                success: false,
                message: 'Pharmacy not found'
            });
        }

        pharmacy.deleteOne();
        await user.save();

        res.json({
            success: true,
            message: 'Pharmacy deleted'
        });
    } catch (error) {
        console.error('Delete pharmacy error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting pharmacy'
        });
    }
});

// @route   GET /api/users/consent
// @desc    Get user consent status
// @access  Private
router.get('/consent', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('consent');
        res.json({
            success: true,
            consent: user.consent || {}
        });
    } catch (error) {
        console.error('Get consent error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching consent status'
        });
    }
});

// @route   POST /api/users/consent
// @desc    Accept terms, privacy policy, and HIPAA notice
// @access  Private
router.post('/consent', protect, [
    body('acceptTerms').isBoolean().withMessage('Terms acceptance required'),
    body('acceptPrivacy').isBoolean().withMessage('Privacy acceptance required'),
    body('acceptHipaa').isBoolean().withMessage('HIPAA acceptance required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { acceptTerms, acceptPrivacy, acceptHipaa } = req.body;

    if (!acceptTerms || !acceptPrivacy || !acceptHipaa) {
        return res.status(400).json({
            success: false,
            message: 'All agreements must be accepted to continue'
        });
    }

    try {
        const now = new Date();
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                consent: {
                    hasAcceptedTerms: true,
                    termsAcceptedAt: now,
                    termsVersion: '1.0',
                    hasAcceptedPrivacy: true,
                    privacyAcceptedAt: now,
                    privacyVersion: '1.0',
                    hasAcceptedHipaa: true,
                    hipaaAcceptedAt: now,
                    hipaaVersion: '1.0',
                    ipAddress: ipAddress
                }
            },
            { new: true }
        );

        res.json({
            success: true,
            message: 'Consent recorded successfully',
            consent: user.consent
        });
    } catch (error) {
        console.error('Record consent error:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording consent'
        });
    }
});

module.exports = router;
