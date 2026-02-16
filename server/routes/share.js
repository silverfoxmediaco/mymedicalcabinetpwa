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
const rateLimit = require('express-rate-limit');
const FamilyMember = require('../models/FamilyMember');
const { protect, authorize } = require('../middleware/auth');
const { sendShareInvitation, sendAccessNotification } = require('../services/emailService');
const documentService = require('../services/documentService');

// Rate limiting for share creation (5 per 15 minutes per IP)
const shareCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many share requests. Please try again later.' }
});

// Rate limiting for OTP verification (10 per 15 minutes per IP)
const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many verification attempts. Please try again later.' }
});

// Rate limiting for status checks (30 per 15 minutes per IP)
const statusCheckLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many requests. Please try again later.' }
});

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


// @route   POST /api/share/email-otp
// @desc    Create email share with OTP verification
// @access  Private
router.post('/email-otp', protect, shareCreateLimiter, [
    body('recipientEmail').isEmail().withMessage('Valid recipient email is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { recipientEmail, recipientName, permissions, familyMemberId, reasonForVisit } = req.body;

    try {
        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999);

        // Set expiration to 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Create share access record
        const shareAccess = new ShareAccess({
            patientId: req.user._id,
            familyMemberId: familyMemberId || null,
            type: 'email-otp',
            recipientEmail: recipientEmail.toLowerCase().trim(),
            recipientName: recipientName?.trim() || null,
            permissions: permissions || {
                medicalHistory: true,
                medications: true,
                allergies: true,
                appointments: false,
                insurance: false,
                doctors: false,
                intakeForm: false
            },
            reasonForVisit: reasonForVisit || undefined,
            expiresAt,
            status: 'approved'
        });

        await shareAccess.save();

        // Set OTP (hashed)
        await shareAccess.setOtp(otp);

        // Build access URL
        const frontendUrl = process.env.FRONTEND_URL || 'https://mymedicalcabinet.com';
        const accessUrl = `${frontendUrl}/shared-records/${shareAccess.accessCode}`;

        // Get patient name — use family member name if sharing a family member's profile
        let patientName = `${req.user.firstName} ${req.user.lastName}`;
        if (familyMemberId) {
            const familyMember = await FamilyMember.findOne({ _id: familyMemberId, userId: req.user._id });
            if (familyMember) {
                patientName = `${familyMember.firstName}${familyMember.lastName ? ' ' + familyMember.lastName : ''}`;
            }
        }

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
router.post('/verify-otp/:accessCode', otpVerifyLimiter, async (req, res) => {
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

        if (!shareAccess || !shareAccess.isValidAccess()) {
            return res.status(404).json({
                success: false,
                message: 'This share link is invalid or has expired'
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
        }).populate('patientId', 'firstName lastName dateOfBirth phone email backupEmail address emergencyContact gender preferredLanguage race ethnicity maritalStatus occupation employer advanceDirectives pharmacies');

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
        const familyMemberFilter = shareAccess.familyMemberId
            ? { familyMemberId: shareAccess.familyMemberId }
            : { familyMemberId: null };

        // If sharing a family member's profile, load their demographics instead of the primary user's
        let personData;
        if (shareAccess.familyMemberId) {
            const fm = await FamilyMember.findById(shareAccess.familyMemberId);
            personData = {
                firstName: fm?.firstName || '',
                lastName: fm?.lastName || '',
                dateOfBirth: fm?.dateOfBirth || null,
                phone: fm?.phone || '',
                email: fm?.email || '',
                address: fm?.address || {},
                emergencyContact: fm?.emergencyContact || {},
                gender: fm?.gender || '',
                race: fm?.race || '',
                ethnicity: fm?.ethnicity || '',
                preferredLanguage: fm?.preferredLanguage || '',
                maritalStatus: fm?.maritalStatus || '',
                occupation: fm?.occupation || '',
                employer: fm?.employer || '',
                advanceDirectives: {},
                pharmacies: fm?.pharmacies || []
            };
        } else {
            const p = shareAccess.patientId;
            personData = {
                firstName: p.firstName,
                lastName: p.lastName,
                dateOfBirth: p.dateOfBirth,
                phone: p.phone,
                email: p.email,
                backupEmail: p.backupEmail,
                address: p.address,
                emergencyContact: p.emergencyContact,
                gender: p.gender,
                race: p.race,
                ethnicity: p.ethnicity,
                preferredLanguage: p.preferredLanguage,
                maritalStatus: p.maritalStatus,
                occupation: p.occupation,
                employer: p.employer,
                advanceDirectives: p.advanceDirectives,
                pharmacies: p.pharmacies
            };
        }

        const data = {
            patient: {
                firstName: personData.firstName,
                lastName: personData.lastName,
                dateOfBirth: personData.dateOfBirth,
                phone: personData.phone,
                email: personData.email,
                backupEmail: personData.backupEmail,
                address: personData.address,
                emergencyContact: personData.emergencyContact
            },
            shareInfo: {
                sharedAt: shareAccess.createdAt,
                expiresAt: shareAccess.expiresAt,
                permissions: shareAccess.permissions,
                recipientEmail: shareAccess.recipientEmail,
                recipientName: shareAccess.recipientName,
                familyMemberId: shareAccess.familyMemberId || null
            }
        };

        if (shareAccess.permissions.medicalHistory) {
            const history = await MedicalHistory.findOne({ userId: patientId, ...familyMemberFilter });

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
            const history = await MedicalHistory.findOne({ userId: patientId, ...familyMemberFilter });
            data.allergies = history?.allergies || [];
        }

        if (shareAccess.permissions.medications) {
            data.medications = await Medication.find({
                userId: patientId,
                ...familyMemberFilter,
                status: 'active'
            }).select('name genericName dosage frequency timeOfDay purpose prescribedBy prescribedDate pharmacy refillsRemaining nextRefillDate instructions sideEffects startDate');
        }

        if (shareAccess.permissions.appointments) {
            data.appointments = await Appointment.find({
                userId: patientId,
                ...familyMemberFilter,
                dateTime: { $gte: new Date() },
                status: { $in: ['scheduled', 'confirmed'] }
            }).select('title doctorName specialty dateTime duration type reason location notes status');
        }

        if (shareAccess.permissions.doctors) {
            data.doctors = await Doctor.find({ patientId, ...familyMemberFilter })
                .select('name specialty practice phone fax email npiNumber isPrimaryCare notes');
        }

        if (shareAccess.permissions.insurance) {
            const insuranceRecords = await Insurance.find({
                userId: patientId,
                ...familyMemberFilter,
                isActive: true
            }).select('provider plan memberId groupNumber subscriberName subscriberDOB relationship effectiveDate terminationDate coverage isPrimary documents');

            // Generate presigned URLs for insurance documents
            data.insurance = await Promise.all(insuranceRecords.map(async (ins) => {
                const insObj = ins.toObject();

                // Generate presigned URLs for each document
                if (insObj.documents && insObj.documents.length > 0) {
                    insObj.documents = await Promise.all(insObj.documents.map(async (doc) => {
                        try {
                            const downloadUrl = await documentService.getDownloadUrl(doc.s3Key);
                            return {
                                ...doc,
                                downloadUrl
                            };
                        } catch (err) {
                            console.error('Error generating insurance doc download URL:', err);
                            return doc;
                        }
                    }));
                }

                return insObj;
            }));
        }

        if (shareAccess.permissions.intakeForm) {
            const intakeHistory = await MedicalHistory.findOne({ userId: patientId, ...familyMemberFilter });
            const activeMeds = await Medication.find({ userId: patientId, ...familyMemberFilter, status: 'active' })
                .select('name genericName dosage frequency purpose prescribedBy');
            const intakeDoctors = await Doctor.find({ patientId, ...familyMemberFilter })
                .select('name specialty practice phone isPrimaryCare');
            const intakeInsurance = await Insurance.find({ userId: patientId, ...familyMemberFilter, isActive: true })
                .select('provider plan memberId groupNumber subscriberName relationship effectiveDate');

            data.intakeForm = {
                demographics: {
                    firstName: personData.firstName,
                    lastName: personData.lastName,
                    dateOfBirth: personData.dateOfBirth,
                    gender: personData.gender,
                    race: personData.race,
                    ethnicity: personData.ethnicity,
                    preferredLanguage: personData.preferredLanguage,
                    maritalStatus: personData.maritalStatus,
                    occupation: personData.occupation,
                    employer: personData.employer,
                    phone: personData.phone,
                    email: personData.email,
                    address: personData.address
                },
                emergencyContact: personData.emergencyContact,
                advanceDirectives: personData.advanceDirectives,
                pharmacies: personData.pharmacies,
                socialHistory: intakeHistory?.socialHistory || {},
                vitals: {
                    bloodType: intakeHistory?.bloodType,
                    height: intakeHistory?.height,
                    weight: intakeHistory?.weight
                },
                conditions: intakeHistory?.conditions || [],
                allergies: intakeHistory?.allergies || [],
                surgeries: intakeHistory?.surgeries || [],
                familyHistory: intakeHistory?.familyHistory || [],
                pastMedicalChecklist: intakeHistory?.pastMedicalChecklist || {},
                familyHistoryChecklist: intakeHistory?.familyHistoryChecklist || {},
                medications: activeMeds,
                doctors: intakeDoctors,
                insurance: intakeInsurance
            };

            if (shareAccess.reasonForVisit) {
                data.intakeForm.reasonForVisit = shareAccess.reasonForVisit;
            }
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
router.get('/status/:accessCode', statusCheckLimiter, async (req, res) => {
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

// @route   POST /api/share/log-download/:accessCode
// @desc    Log PDF download and notify patient
// @access  Public (with valid session token)
router.post('/log-download/:accessCode', async (req, res) => {
    const sessionToken = req.headers['x-session-token'];

    if (!sessionToken) {
        return res.status(401).json({ success: false, message: 'Session token required' });
    }

    try {
        const shareAccess = await ShareAccess.findOne({
            accessCode: req.params.accessCode
        });

        if (!shareAccess) {
            return res.status(404).json({ success: false, message: 'Invalid access link' });
        }

        if (!shareAccess.validateSession(sessionToken)) {
            return res.status(401).json({ success: false, message: 'Session expired' });
        }

        // Log the download in the access log
        await shareAccess.logAccess({
            accessedBy: shareAccess.recipientEmail || req.ip,
            ipAddress: req.ip,
            dataAccessed: ['pdf_download']
        });

        // Notify patient that records were downloaded
        try {
            const patient = await User.findById(shareAccess.patientId);
            if (patient) {
                await sendAccessNotification(patient, {
                    accessedAt: new Date(),
                    accessedBy: shareAccess.recipientName || shareAccess.recipientEmail || 'Recipient',
                    dataAccessed: 'PDF downloaded'
                });
            }
        } catch (emailError) {
            console.error('Failed to send download notification:', emailError);
        }

        res.json({ success: true, message: 'Download logged' });
    } catch (error) {
        console.error('Log download error:', error);
        res.status(500).json({ success: false, message: 'Error logging download' });
    }
});

// @route   GET /api/share/access-logs
// @desc    Get access logs for patient's shares
// @access  Private
router.get('/access-logs', protect, async (req, res) => {
    try {
        const shares = await ShareAccess.find({ patientId: req.user._id })
            .select('recipientEmail recipientName accessLog timesAccessed createdAt expiresAt familyMemberId type status')
            .sort({ createdAt: -1 })
            .limit(50);

        // Flatten access logs with share context
        const logs = [];
        for (const share of shares) {
            if (share.accessLog && share.accessLog.length > 0) {
                for (const entry of share.accessLog) {
                    logs.push({
                        shareId: share._id,
                        recipientEmail: share.recipientEmail,
                        recipientName: share.recipientName,
                        familyMemberId: share.familyMemberId || null,
                        accessedAt: entry.accessedAt,
                        accessedBy: entry.accessedBy,
                        dataAccessed: entry.dataAccessed,
                        ipAddress: entry.ipAddress
                    });
                }
            }
        }

        // Sort all logs by date descending
        logs.sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt));

        res.json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('Get access logs error:', error);
        res.status(500).json({ success: false, message: 'Error fetching access logs' });
    }
});

module.exports = router;
