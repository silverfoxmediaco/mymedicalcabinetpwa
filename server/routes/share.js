import express from 'express';
import crypto from 'crypto';
import ShareAccess from '../models/ShareAccess.js';
import User from '../models/User.js';
import { sendShareInvitation, sendAccessNotification } from '../services/emailService.js';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   POST /api/share/email-otp
 * @desc    Create a new share with email OTP verification
 * @access  Protected (authenticated users only)
 */
router.post('/email-otp', authenticate, async (req, res) => {
  try {
    const { recipientEmail, recipientName, permissions } = req.body;
    const userId = req.user._id;

    // Validate recipient email
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid recipient email is required'
      });
    }

    // Get user info for the email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999);

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create the share access record
    const shareAccess = new ShareAccess({
      userId,
      type: 'email-otp',
      recipientEmail: recipientEmail.toLowerCase().trim(),
      recipientName: recipientName?.trim() || null,
      permissions: permissions || {
        emergencyContacts: true,
        medications: true,
        doctors: true,
        insurance: true,
        medicalHistory: true,
        allergies: true,
        vitals: false,
        procedures: false,
        events: false,
        documents: false
      },
      expiresAt
    });

    // Set the OTP (hashed)
    await shareAccess.setOtp(otp);

    // Build the access URL
    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const accessUrl = `${siteUrl}/shared-records/${shareAccess.accessCode}`;

    // Get patient name for email
    const patientName = user.profile
      ? `${user.profile.title || ''} ${user.profile.firstName} ${user.profile.lastName}`.trim()
      : user.email;

    // Send the invitation email
    await sendShareInvitation(recipientEmail, {
      patientName,
      recipientName: recipientName || null,
      accessUrl,
      otp,
      expiresAt
    });

    logger.info(`Share created: ${shareAccess._id} for user ${userId} to ${recipientEmail}`);

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
    logger.error('Error creating email-otp share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create share. Please try again.'
    });
  }
});

/**
 * @route   POST /api/share/verify-otp/:accessCode
 * @desc    Verify OTP and get session token
 * @access  Public
 */
router.post('/verify-otp/:accessCode', async (req, res) => {
  try {
    const { accessCode } = req.params;
    const { otp } = req.body;

    // Validate OTP format
    if (!otp || !/^\d{6}$/.test(otp.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit verification code'
      });
    }

    // Find the share
    const share = await ShareAccess.findOne({ accessCode });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found or has expired'
      });
    }

    // Check if share is still valid
    if (!share.isValid) {
      let message = 'This share link is no longer valid';
      if (share.status === 'revoked') {
        message = 'This share has been revoked by the patient';
      } else if (share.status === 'expired' || new Date() > share.expiresAt) {
        message = 'This share link has expired';
      }
      return res.status(410).json({
        success: false,
        message,
        status: share.status
      });
    }

    // Verify the OTP
    try {
      await share.verifyOtp(otp.toString());
    } catch (otpError) {
      return res.status(401).json({
        success: false,
        message: otpError.message
      });
    }

    // Generate session token
    const sessionToken = await share.generateSessionToken();

    logger.info(`OTP verified for share ${share._id}`);

    res.json({
      success: true,
      message: 'Verification successful',
      data: {
        sessionToken,
        expiresAt: share.sessionExpiresAt
      }
    });
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
});

/**
 * @route   GET /api/share/records/:accessCode
 * @desc    Get shared records (requires session token)
 * @access  Public (with valid session token)
 */
router.get('/records/:accessCode', async (req, res) => {
  try {
    const { accessCode } = req.params;
    const sessionToken = req.headers['x-session-token'];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'Session token required'
      });
    }

    // Find the share
    const share = await ShareAccess.findOne({ accessCode });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    // Validate session
    if (!share.validateSession(sessionToken)) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please verify again.'
      });
    }

    // Check if share is still valid
    if (!share.isValid) {
      return res.status(410).json({
        success: false,
        message: 'This share is no longer valid',
        status: share.status
      });
    }

    // Get the user's data
    const user = await User.findById(share.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient records not found'
      });
    }

    // Build the response based on permissions
    const records = {
      patient: {
        name: user.profile
          ? `${user.profile.title || ''} ${user.profile.firstName} ${user.profile.lastName}`.trim()
          : 'Patient',
        // Only include non-sensitive basic info
        ...(user.profile && {
          phone: user.profile.phone
        })
      },
      shareInfo: {
        sharedAt: share.createdAt,
        expiresAt: share.expiresAt,
        permissions: share.permissions
      }
    };

    // Add permitted data sections
    // Note: These would come from additional models/collections in a full implementation
    // For now, we're including the structure for what would be returned

    if (share.permissions.emergencyContacts) {
      records.emergencyContacts = user.emergencyContacts || [];
    }

    if (share.permissions.medications) {
      records.medications = user.medications || [];
    }

    if (share.permissions.doctors) {
      records.doctors = user.doctors || [];
    }

    if (share.permissions.insurance) {
      records.insurance = user.insurance || null;
    }

    if (share.permissions.medicalHistory) {
      records.conditions = user.conditions || [];
    }

    if (share.permissions.allergies) {
      records.allergies = user.allergies || [];
    }

    if (share.permissions.vitals) {
      records.vitals = user.vitals || [];
    }

    if (share.permissions.procedures) {
      records.procedures = user.procedures || [];
    }

    if (share.permissions.events) {
      records.events = user.events || [];
    }

    if (share.permissions.documents) {
      records.documents = user.documents || [];
    }

    // Determine what data was accessed for logging
    const dataAccessed = Object.keys(share.permissions)
      .filter(key => share.permissions[key]);

    // Log the access
    await share.logAccess({
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      dataAccessed,
      action: 'view'
    });

    // Send notification to patient if not already sent
    if (!share.notificationSentToPatient) {
      try {
        await sendAccessNotification(user.email, {
          patientName: records.patient.name,
          recipientEmail: share.recipientEmail,
          recipientName: share.recipientName,
          accessTime: new Date(),
          ipAddress: req.ip || req.connection.remoteAddress
        });
        share.notificationSentToPatient = true;
        await share.save();
      } catch (emailError) {
        // Don't fail the request if notification fails
        logger.error('Failed to send access notification:', emailError);
      }
    }

    logger.info(`Records accessed for share ${share._id}`);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    logger.error('Error getting shared records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve records. Please try again.'
    });
  }
});

/**
 * @route   GET /api/share
 * @desc    Get all shares created by the authenticated user
 * @access  Protected
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const shares = await ShareAccess.find({ userId })
      .select('-otpHash -sessionToken')
      .sort({ createdAt: -1 });

    // Update status for expired shares
    const now = new Date();
    for (const share of shares) {
      if (share.status === 'active' && share.expiresAt < now) {
        share.status = 'expired';
        await share.save();
      }
    }

    res.json({
      success: true,
      data: shares
    });
  } catch (error) {
    logger.error('Error getting user shares:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve shares'
    });
  }
});

/**
 * @route   GET /api/share/:id
 * @desc    Get a specific share by ID
 * @access  Protected (owner only)
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const share = await ShareAccess.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).select('-otpHash -sessionToken');

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    res.json({
      success: true,
      data: share
    });
  } catch (error) {
    logger.error('Error getting share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve share'
    });
  }
});

/**
 * @route   PUT /api/share/:id/revoke
 * @desc    Revoke a share
 * @access  Protected (owner only)
 */
router.put('/:id/revoke', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;

    const share = await ShareAccess.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    if (share.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Share is already inactive'
      });
    }

    await share.revoke(reason || 'Revoked by user');

    logger.info(`Share ${share._id} revoked by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Share revoked successfully',
      data: {
        shareId: share._id,
        status: share.status,
        revokedAt: share.revokedAt
      }
    });
  } catch (error) {
    logger.error('Error revoking share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke share'
    });
  }
});

/**
 * @route   GET /api/share/status/:accessCode
 * @desc    Check share status (public - for checking before OTP entry)
 * @access  Public
 */
router.get('/status/:accessCode', async (req, res) => {
  try {
    const { accessCode } = req.params;

    const share = await ShareAccess.findOne({ accessCode })
      .select('status expiresAt type recipientEmail createdAt');

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found',
        status: 'not_found'
      });
    }

    // Check if expired
    const isExpired = share.expiresAt < new Date();

    res.json({
      success: true,
      data: {
        status: isExpired ? 'expired' : share.status,
        type: share.type,
        expiresAt: share.expiresAt,
        isValid: share.status === 'active' && !isExpired
      }
    });
  } catch (error) {
    logger.error('Error checking share status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check share status'
    });
  }
});

export default router;
