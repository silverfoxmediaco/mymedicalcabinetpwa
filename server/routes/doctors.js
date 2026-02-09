const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');
const { getFamilyMemberFilter } = require('../middleware/familyMemberScope');

// @route   GET /api/doctors
// @desc    Get all doctors for a patient
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { familyMemberId } = req.query;
        const familyFilter = await getFamilyMemberFilter(req.user._id, familyMemberId);
        const doctors = await Doctor.find({ patientId: req.user._id, ...familyFilter }).sort({ isPrimaryCare: -1, name: 1 });

        res.json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error fetching doctors'
        });
    }
});

// @route   GET /api/doctors/:id
// @desc    Get single doctor
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({
            _id: req.params.id,
            patientId: req.user._id
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.json({
            success: true,
            data: doctor
        });
    } catch (error) {
        console.error('Get doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor'
        });
    }
});

// @route   POST /api/doctors
// @desc    Add a doctor
// @access  Private
router.post('/', protect, [
    body('name').notEmpty().withMessage('Doctor name is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const familyFilter = await getFamilyMemberFilter(req.user._id, req.body.familyMemberId);

        // If setting as primary care, unset any existing primary
        if (req.body.isPrimaryCare) {
            await Doctor.updateMany(
                { patientId: req.user._id, ...familyFilter, isPrimaryCare: true },
                { isPrimaryCare: false }
            );
        }

        const doctor = await Doctor.create({
            ...req.body,
            patientId: req.user._id,
            ...familyFilter
        });

        res.status(201).json({
            success: true,
            message: 'Doctor added',
            data: doctor
        });
    } catch (error) {
        console.error('Add doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding doctor'
        });
    }
});

// @route   PUT /api/doctors/:id
// @desc    Update a doctor
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let doctor = await Doctor.findOne({
            _id: req.params.id,
            patientId: req.user._id
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // If setting as primary care, unset any existing primary
        if (req.body.isPrimaryCare && !doctor.isPrimaryCare) {
            await Doctor.updateMany(
                { patientId: req.user._id, isPrimaryCare: true },
                { isPrimaryCare: false }
            );
        }

        doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Doctor updated',
            data: doctor
        });
    } catch (error) {
        console.error('Update doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating doctor'
        });
    }
});

// @route   DELETE /api/doctors/:id
// @desc    Delete a doctor
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const doctor = await Doctor.findOneAndDelete({
            _id: req.params.id,
            patientId: req.user._id
        });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.json({
            success: true,
            message: 'Doctor deleted'
        });
    } catch (error) {
        console.error('Delete doctor error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting doctor'
        });
    }
});

// === DOCTOR ACCOUNT ROUTES ===

// @route   POST /api/doctors/register
// @desc    Register as a doctor (requires verification)
// @access  Private
router.post('/register', protect, [
    body('specialty').notEmpty().withMessage('Specialty is required'),
    body('npiNumber').notEmpty().withMessage('NPI number is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        // Create doctor profile linked to user account
        const doctorProfile = await Doctor.create({
            userId: req.user._id,
            name: `${req.user.firstName} ${req.user.lastName}`,
            email: req.user.email,
            specialty: req.body.specialty,
            npiNumber: req.body.npiNumber,
            practice: req.body.practice,
            phone: req.body.phone,
            isVerified: false // Requires admin verification
        });

        // Update user role to doctor (pending verification)
        req.user.role = 'doctor';
        await req.user.save();

        res.status(201).json({
            success: true,
            message: 'Doctor registration submitted. Pending verification.',
            data: doctorProfile
        });
    } catch (error) {
        console.error('Doctor registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering as doctor'
        });
    }
});

// @route   GET /api/doctors/patients
// @desc    Get patients who have shared access with doctor
// @access  Private (Doctor only)
router.get('/my/patients', protect, authorize('doctor'), async (req, res) => {
    try {
        const ShareAccess = require('../models/ShareAccess');

        const sharedAccess = await ShareAccess.find({
            doctorId: req.user._id,
            status: 'approved',
            isActive: true
        }).populate('patientId', 'firstName lastName email');

        res.json({
            success: true,
            count: sharedAccess.length,
            data: sharedAccess
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching patients'
        });
    }
});

module.exports = router;
