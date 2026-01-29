const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ShareAccess = require('../models/ShareAccess');
const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');
const Medication = require('../models/Medication');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Insurance = require('../models/Insurance');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/share
// @desc    Get all share access records for patient
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const shares = await ShareAccess.find({ patientId: req.user._id })
            .populate('doctorId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: shares.length,
            data: shares
        });
    } catch (error) {
        console.error('Get shares error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching share records'
        });
    }
});

// @route   POST /api/share/qr-code
// @desc    Generate QR code for sharing
// @access  Private
router.post('/qr-code', protect, async (req, res) => {
    const { permissions, expiresIn, maxAccesses } = req.body;

    try {
        // Calculate expiration
        let expiresAt = null;
        if (expiresIn) {
            expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + expiresIn);
        }

        const shareAccess = await ShareAccess.create({
            patientId: req.user._id,
            type: 'qr-code',
            permissions: permissions || {
                medicalHistory: true,
                medications: true,
                allergies: true,
                appointments: false,
                insurance: false,
                doctors: false
            },
            expiresAt,
            maxAccesses
        });

        // Generate QR code data URL
        const qrData = `${process.env.FRONTEND_URL || 'https://mymedicalcabinet.com'}/share/${shareAccess.accessCode}`;

        shareAccess.qrCodeData = qrData;
        await shareAccess.save();

        res.status(201).json({
            success: true,
            message: 'QR code generated',
            data: {
                accessCode: shareAccess.accessCode,
                qrCodeUrl: qrData,
                expiresAt: shareAccess.expiresAt,
                maxAccesses: shareAccess.maxAccesses,
                permissions: shareAccess.permissions
            }
        });
    } catch (error) {
        console.error('Generate QR error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating QR code'
        });
    }
});

// @route   GET /api/share/access/:accessCode
// @desc    Access shared data via QR code/link
// @access  Public
router.get('/access/:accessCode', async (req, res) => {
    try {
        const shareAccess = await ShareAccess.findOne({
            accessCode: req.params.accessCode
        }).populate('patientId', 'firstName lastName dateOfBirth');

        if (!shareAccess) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired access code'
            });
        }

        // Validate access
        if (!shareAccess.isValidAccess()) {
            return res.status(403).json({
                success: false,
                message: 'This access link has expired or reached its limit'
            });
        }

        // Gather permitted data
        const patientId = shareAccess.patientId._id;
        const data = {
            patient: {
                firstName: shareAccess.patientId.firstName,
                lastName: shareAccess.patientId.lastName,
                dateOfBirth: shareAccess.patientId.dateOfBirth
            }
        };

        if (shareAccess.permissions.medicalHistory) {
            const history = await MedicalHistory.findOne({ userId: patientId });
            data.medicalHistory = {
                conditions: history?.conditions || [],
                surgeries: history?.surgeries || [],
                familyHistory: history?.familyHistory || [],
                bloodType: history?.bloodType,
                height: history?.height,
                weight: history?.weight
            };
        }

        if (shareAccess.permissions.allergies) {
            const history = await MedicalHistory.findOne({ userId: patientId });
            data.allergies = history?.allergies || [];
        }

        if (shareAccess.permissions.medications) {
            data.medications = await Medication.find({
                userId: patientId,
                status: 'active'
            }).select('name genericName dosage frequency purpose');
        }

        if (shareAccess.permissions.appointments) {
            data.appointments = await Appointment.find({
                userId: patientId,
                dateTime: { $gte: new Date() },
                status: { $in: ['scheduled', 'confirmed'] }
            }).select('doctorName dateTime type location');
        }

        if (shareAccess.permissions.doctors) {
            data.doctors = await Doctor.find({ patientId })
                .select('name specialty phone practice isPrimaryCare');
        }

        if (shareAccess.permissions.insurance) {
            data.insurance = await Insurance.find({
                userId: patientId,
                isActive: true
            }).select('provider plan memberId groupNumber');
        }

        // Log access
        await shareAccess.logAccess({
            accessedBy: req.ip,
            ipAddress: req.ip,
            dataAccessed: Object.keys(data)
        });

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Access shared data error:', error);
        res.status(500).json({
            success: false,
            message: 'Error accessing shared data'
        });
    }
});

// @route   POST /api/share/doctor-request
// @desc    Doctor requests access to patient data
// @access  Private (Doctor only)
router.post('/doctor-request', protect, authorize('doctor'), [
    body('patientEmail').isEmail().withMessage('Valid patient email is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { patientEmail, permissions, message } = req.body;

    try {
        // Find patient
        const patient = await User.findOne({ email: patientEmail, role: 'patient' });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Check for existing pending request
        const existingRequest = await ShareAccess.findOne({
            patientId: patient._id,
            doctorId: req.user._id,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'A pending request already exists for this patient'
            });
        }

        const shareAccess = await ShareAccess.create({
            patientId: patient._id,
            doctorId: req.user._id,
            type: 'doctor-account',
            permissions: permissions || {
                medicalHistory: true,
                medications: true,
                allergies: true,
                appointments: true,
                insurance: false,
                doctors: true
            },
            status: 'pending'
        });

        // TODO: Send notification email to patient

        res.status(201).json({
            success: true,
            message: 'Access request sent to patient',
            data: shareAccess
        });
    } catch (error) {
        console.error('Doctor request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending access request'
        });
    }
});

// @route   GET /api/share/requests
// @desc    Get pending access requests for patient
// @access  Private
router.get('/requests', protect, async (req, res) => {
    try {
        const requests = await ShareAccess.find({
            patientId: req.user._id,
            type: 'doctor-account',
            status: 'pending'
        }).populate('doctorId', 'firstName lastName email');

        // Get doctor profiles for the requesting doctors
        const doctorProfiles = await Doctor.find({
            userId: { $in: requests.map(r => r.doctorId._id) }
        });

        const requestsWithProfiles = requests.map(request => {
            const profile = doctorProfiles.find(
                p => p.userId?.toString() === request.doctorId._id.toString()
            );
            return {
                ...request.toObject(),
                doctorProfile: profile
            };
        });

        res.json({
            success: true,
            count: requests.length,
            data: requestsWithProfiles
        });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching access requests'
        });
    }
});

// @route   PUT /api/share/requests/:id/approve
// @desc    Approve doctor access request
// @access  Private
router.put('/requests/:id/approve', protect, async (req, res) => {
    try {
        const shareAccess = await ShareAccess.findOneAndUpdate(
            {
                _id: req.params.id,
                patientId: req.user._id,
                status: 'pending'
            },
            {
                status: 'approved',
                approvedAt: new Date()
            },
            { new: true }
        ).populate('doctorId', 'firstName lastName email');

        if (!shareAccess) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // TODO: Send notification email to doctor

        res.json({
            success: true,
            message: 'Access approved',
            data: shareAccess
        });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving request'
        });
    }
});

// @route   PUT /api/share/requests/:id/deny
// @desc    Deny doctor access request
// @access  Private
router.put('/requests/:id/deny', protect, async (req, res) => {
    try {
        const shareAccess = await ShareAccess.findOneAndUpdate(
            {
                _id: req.params.id,
                patientId: req.user._id,
                status: 'pending'
            },
            { status: 'denied' },
            { new: true }
        );

        if (!shareAccess) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        res.json({
            success: true,
            message: 'Access denied',
            data: shareAccess
        });
    } catch (error) {
        console.error('Deny request error:', error);
        res.status(500).json({
            success: false,
            message: 'Error denying request'
        });
    }
});

// @route   PUT /api/share/:id/revoke
// @desc    Revoke access
// @access  Private
router.put('/:id/revoke', protect, async (req, res) => {
    try {
        const shareAccess = await ShareAccess.findOneAndUpdate(
            {
                _id: req.params.id,
                patientId: req.user._id
            },
            {
                isActive: false,
                status: 'revoked'
            },
            { new: true }
        );

        if (!shareAccess) {
            return res.status(404).json({
                success: false,
                message: 'Share access not found'
            });
        }

        res.json({
            success: true,
            message: 'Access revoked',
            data: shareAccess
        });
    } catch (error) {
        console.error('Revoke access error:', error);
        res.status(500).json({
            success: false,
            message: 'Error revoking access'
        });
    }
});

// @route   DELETE /api/share/:id
// @desc    Delete share access record
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const shareAccess = await ShareAccess.findOneAndDelete({
            _id: req.params.id,
            patientId: req.user._id
        });

        if (!shareAccess) {
            return res.status(404).json({
                success: false,
                message: 'Share access not found'
            });
        }

        res.json({
            success: true,
            message: 'Share access deleted'
        });
    } catch (error) {
        console.error('Delete share error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting share access'
        });
    }
});

module.exports = router;
