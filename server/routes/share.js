const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const ShareAccess = require('../models/ShareAccess');
const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');
const Medication = require('../models/Medication');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Insurance = require('../models/Insurance');
const { protect, authorize } = require('../middleware/auth');
const { sendShareInvitation, sendAccessNotification } = require('../services/emailService');
const documentService = require('../services/documentService');

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

// @route   POST /api/share/email-otp
// @desc    Create email share with OTP verification
// @access  Private
router.post('/email-otp', protect, [
    body('recipientEmail').isEmail().withMessage('Valid recipient email is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { recipientEmail, recipientName, permissions } = req.body;

    try {
        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999);

        // Set expiration to 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create share access record
        const shareAccess = new ShareAccess({
            patientId: req.user._id,
            type: 'email-otp',
            recipientEmail: recipientEmail.toLowerCase().trim(),
            recipientName: recipientName?.trim() || null,
            permissions: permissions || {
                medicalHistory: true,
                medications: true,
                allergies: true,
                appointments: false,
                insurance: false,
                doctors: false
            },
            expiresAt,
            status: 'approved'
        });

        await shareAccess.save();

        // Set OTP (hashed)
        await shareAccess.setOtp(otp);

        // Build access URL
        const frontendUrl = process.env.FRONTEND_URL || 'https://mymedicalcabinet.com';
        const accessUrl = `${frontendUrl}/shared-records/${shareAccess.accessCode}`;

        // Get patient name
        const patientName = `${req.user.firstName} ${req.user.lastName}`;

        // Send email
        await sendShareInvitation(recipientEmail, {
            patientName,
            recipientName: recipientName || null,
            accessUrl,
            otp,
            expiresAt
        });

        console.log(`Email-OTP share created: ${shareAccess._id} for ${recipientEmail}`);

        res.status(201).json({
            success: true,
            message: 'Share invitation sent successfully',
            data: {
                shareId: shareAccess._id,
                accessCode: shareAccess.accessCode,
                recipientEmail: shareAccess.recipientEmail,
                expiresAt: shareAccess.expiresAt
            }
        });
    } catch (error) {
        console.error('Email-OTP share error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating share invitation'
        });
    }
});

// @route   POST /api/share/verify-otp/:accessCode
// @desc    Verify OTP and get session token
// @access  Public
router.post('/verify-otp/:accessCode', async (req, res) => {
    const { otp } = req.body;

    // Validate OTP format
    if (!otp || !/^\d{6}$/.test(otp.toString())) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid 6-digit verification code'
        });
    }

    try {
        const shareAccess = await ShareAccess.findOne({
            accessCode: req.params.accessCode
        });

        if (!shareAccess) {
            return res.status(404).json({
                success: false,
                message: 'Share link not found'
            });
        }

        // Check if share is valid
        if (!shareAccess.isValidAccess()) {
            let message = 'This share link is no longer valid';
            if (shareAccess.status === 'revoked') {
                message = 'This share has been revoked';
            } else if (new Date() > shareAccess.expiresAt) {
                message = 'This share link has expired';
            }
            return res.status(410).json({
                success: false,
                message,
                status: shareAccess.status
            });
        }

        // Verify OTP
        try {
            await shareAccess.verifyOtp(otp.toString());
        } catch (otpError) {
            return res.status(401).json({
                success: false,
                message: otpError.message
            });
        }

        // Generate session token
        const sessionToken = await shareAccess.generateSessionToken();

        console.log(`OTP verified for share ${shareAccess._id}`);

        res.json({
            success: true,
            message: 'Verification successful',
            data: {
                sessionToken,
                expiresAt: shareAccess.sessionExpiresAt
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

// @route   GET /api/share/records/:accessCode
// @desc    Get shared records (requires session token)
// @access  Public (with valid session token)
router.get('/records/:accessCode', async (req, res) => {
    const sessionToken = req.headers['x-session-token'];

    if (!sessionToken) {
        return res.status(401).json({
            success: false,
            message: 'Session token required'
        });
    }

    try {
        const shareAccess = await ShareAccess.findOne({
            accessCode: req.params.accessCode
        }).populate('patientId', 'firstName lastName dateOfBirth phone email backupEmail address emergencyContact');

        if (!shareAccess) {
            return res.status(404).json({
                success: false,
                message: 'Share not found'
            });
        }

        // Validate session
        if (!shareAccess.validateSession(sessionToken)) {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please verify again.'
            });
        }

        // Check if share is still valid
        if (!shareAccess.isValidAccess()) {
            return res.status(410).json({
                success: false,
                message: 'This share is no longer valid'
            });
        }

        // Gather permitted data
        const patientId = shareAccess.patientId._id;
        const data = {
            patient: {
                firstName: shareAccess.patientId.firstName,
                lastName: shareAccess.patientId.lastName,
                dateOfBirth: shareAccess.patientId.dateOfBirth,
                phone: shareAccess.patientId.phone,
                email: shareAccess.patientId.email,
                backupEmail: shareAccess.patientId.backupEmail,
                address: shareAccess.patientId.address,
                emergencyContact: shareAccess.patientId.emergencyContact
            },
            shareInfo: {
                sharedAt: shareAccess.createdAt,
                expiresAt: shareAccess.expiresAt,
                permissions: shareAccess.permissions,
                recipientEmail: shareAccess.recipientEmail,
                recipientName: shareAccess.recipientName
            }
        };

        if (shareAccess.permissions.medicalHistory) {
            const history = await MedicalHistory.findOne({ userId: patientId });

            // Process events and generate presigned URLs for documents
            let events = [];
            if (history?.events && history.events.length > 0) {
                events = await Promise.all(history.events.map(async (event) => {
                    const eventObj = event.toObject();

                    // Generate presigned URLs for each document
                    if (eventObj.documents && eventObj.documents.length > 0) {
                        eventObj.documents = await Promise.all(eventObj.documents.map(async (doc) => {
                            try {
                                const downloadUrl = await documentService.getDownloadUrl(doc.s3Key);
                                return {
                                    ...doc,
                                    downloadUrl
                                };
                            } catch (err) {
                                console.error('Error generating download URL:', err);
                                return doc;
                            }
                        }));
                    }

                    return eventObj;
                }));
            }

            data.medicalHistory = {
                conditions: history?.conditions || [],
                surgeries: history?.surgeries || [],
                familyHistory: history?.familyHistory || [],
                events: events,
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
            }).select('name genericName dosage frequency timeOfDay purpose prescribedBy prescribedDate pharmacy refillsRemaining nextRefillDate instructions sideEffects startDate');
        }

        if (shareAccess.permissions.appointments) {
            data.appointments = await Appointment.find({
                userId: patientId,
                dateTime: { $gte: new Date() },
                status: { $in: ['scheduled', 'confirmed'] }
            }).select('title doctorName specialty dateTime duration type reason location notes status');
        }

        if (shareAccess.permissions.doctors) {
            data.doctors = await Doctor.find({ patientId })
                .select('name specialty practice phone fax email npiNumber isPrimaryCare notes');
        }

        if (shareAccess.permissions.insurance) {
            data.insurance = await Insurance.find({
                userId: patientId,
                isActive: true
            }).select('provider plan memberId groupNumber subscriberName subscriberDOB relationship effectiveDate terminationDate coverage isPrimary');
        }

        // Log access
        const dataAccessed = Object.keys(shareAccess.permissions).filter(
            key => shareAccess.permissions[key]
        );

        await shareAccess.logAccess({
            accessedBy: shareAccess.recipientEmail || req.ip,
            ipAddress: req.ip,
            dataAccessed
        });

        // Send notification to patient (first access only)
        if (shareAccess.timesAccessed === 1) {
            try {
                const patient = await User.findById(patientId);
                if (patient) {
                    await sendAccessNotification(patient, {
                        accessedAt: new Date(),
                        accessedBy: shareAccess.recipientName || shareAccess.recipientEmail || 'Healthcare provider',
                        dataAccessed: dataAccessed.join(', ')
                    });
                }
            } catch (emailError) {
                console.error('Failed to send access notification:', emailError);
            }
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get shared records error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving records'
        });
    }
});

// @route   GET /api/share/status/:accessCode
// @desc    Check share status (public)
// @access  Public
router.get('/status/:accessCode', async (req, res) => {
    try {
        const shareAccess = await ShareAccess.findOne({
            accessCode: req.params.accessCode
        }).select('status expiresAt type isActive createdAt');

        if (!shareAccess) {
            return res.status(404).json({
                success: false,
                message: 'Share not found',
                status: 'not_found'
            });
        }

        const isExpired = shareAccess.expiresAt && new Date() > shareAccess.expiresAt;

        res.json({
            success: true,
            data: {
                status: isExpired ? 'expired' : (shareAccess.isActive ? 'active' : shareAccess.status),
                type: shareAccess.type,
                expiresAt: shareAccess.expiresAt,
                isValid: shareAccess.isActive && !isExpired
            }
        });
    } catch (error) {
        console.error('Check share status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking share status'
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
