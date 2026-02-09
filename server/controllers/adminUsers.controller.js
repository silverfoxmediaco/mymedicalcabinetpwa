const crypto = require('crypto');
const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');
const Medication = require('../models/Medication');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Insurance = require('../models/Insurance');
const ShareAccess = require('../models/ShareAccess');
const documentService = require('../services/documentService');
const { sendPasswordResetEmail } = require('../services/emailService');

// @desc    Get all users (paginated, searchable, filterable)
// @route   GET /api/admin/users
// @access  Admin (canManageUsers)
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      role,
      isActive,
      isEmailVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (isActive && isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    if (isEmailVerified && isEmailVerified !== 'all') {
      filter.isEmailVerified = isEmailVerified === 'true';
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get users
    const users = await User.find(filter)
      .select('-password -emailVerificationToken -emailVerificationExpires -consent')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(filter);

    // Stats breakdown
    const [totalAll, byRole, activeCount, verifiedCount] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
    ]);

    const roleBreakdown = {};
    byRole.forEach((r) => {
      roleBreakdown[r._id] = r.count;
    });

    res.json({
      success: true,
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      stats: {
        total: totalAll,
        byRole: roleBreakdown,
        active: activeCount,
        verified: verifiedCount,
      },
    });
  } catch (error) {
    console.error('Admin getAllUsers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user by ID with data summary counts
// @route   GET /api/admin/users/:id
// @access  Admin (canManageUsers)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -emailVerificationToken -emailVerificationExpires'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get data summary counts in parallel
    const [medHistory, medCount, doctorCount, appointmentCount, insuranceCount, shareCount] =
      await Promise.all([
        MedicalHistory.findOne({ userId: user._id }),
        Medication.countDocuments({ userId: user._id }),
        Doctor.countDocuments({ patientId: user._id }),
        Appointment.countDocuments({ userId: user._id }),
        Insurance.countDocuments({ userId: user._id }),
        ShareAccess.countDocuments({ patientId: user._id }),
      ]);

    const conditionCount = medHistory ? medHistory.conditions.length : 0;
    const allergyCount = medHistory ? medHistory.allergies.length : 0;
    const surgeryCount = medHistory ? medHistory.surgeries.length : 0;
    const eventCount = medHistory ? medHistory.events.length : 0;

    res.json({
      success: true,
      user,
      dataSummary: {
        conditions: conditionCount,
        allergies: allergyCount,
        surgeries: surgeryCount,
        events: eventCount,
        medications: medCount,
        doctors: doctorCount,
        appointments: appointmentCount,
        insurancePlans: insuranceCount,
        shareAccesses: shareCount,
      },
    });
  } catch (error) {
    console.error('Admin getUserById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's full medical data for support troubleshooting
// @route   GET /api/admin/users/:id/medical
// @access  Admin (canViewMedicalData)
const getUserMedicalSummary = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('firstName lastName email');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [medHistory, medications, doctors, appointments, insurance, shareAccesses] =
      await Promise.all([
        MedicalHistory.findOne({ userId: user._id }),
        Medication.find({ userId: user._id }).sort({ createdAt: -1 }),
        Doctor.find({ patientId: user._id }).sort({ createdAt: -1 }),
        Appointment.find({ userId: user._id }).sort({ dateTime: -1 }),
        Insurance.find({ userId: user._id }).sort({ createdAt: -1 }),
        ShareAccess.find({ patientId: user._id }).sort({ createdAt: -1 }),
      ]);

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      medicalData: {
        conditions: medHistory ? medHistory.conditions : [],
        allergies: medHistory ? medHistory.allergies : [],
        surgeries: medHistory ? medHistory.surgeries : [],
        familyHistory: medHistory ? medHistory.familyHistory : [],
        events: medHistory ? medHistory.events : [],
        bloodType: medHistory ? medHistory.bloodType : 'unknown',
        height: medHistory ? medHistory.height : null,
        weight: medHistory ? medHistory.weight : null,
        medications,
        doctors,
        appointments,
        insurance,
        shareAccesses,
      },
    });
  } catch (error) {
    console.error('Admin getUserMedicalSummary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Force password reset email for a user
// @route   POST /api/admin/users/:id/reset-password
// @access  Admin (canResetPasswords)
const forcePasswordReset = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store hashed token on user (reuse verification fields for reset)
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    await sendPasswordResetEmail(user, resetToken);

    res.json({
      success: true,
      message: `Password reset email sent to ${user.email}`,
    });
  } catch (error) {
    console.error('Admin forcePasswordReset error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Force email verification for a user
// @route   POST /api/admin/users/:id/verify-email
// @access  Admin (canResetPasswords)
const forceEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Email verified for ${user.email}`,
    });
  } catch (error) {
    console.error('Admin forceEmailVerification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Deactivate a user (soft delete, preserves data)
// @route   PUT /api/admin/users/:id/deactivate
// @access  Admin (canManageUsers)
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(400).json({ success: false, message: 'User is already deactivated' });
    }

    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${user.email} has been deactivated`,
    });
  } catch (error) {
    console.error('Admin deactivateUser error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reactivate a user
// @route   PUT /api/admin/users/:id/reactivate
// @access  Admin (canManageUsers)
const reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isActive) {
      return res.status(400).json({ success: false, message: 'User is already active' });
    }

    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${user.email} has been reactivated`,
    });
  } catch (error) {
    console.error('Admin reactivateUser error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Permanently delete user and CASCADE DELETE all their data
// @route   DELETE /api/admin/users/:id
// @access  Admin (canManageUsers)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const deleteSummary = {
      user: `${user.firstName} ${user.lastName} (${user.email})`,
      medicalHistory: 0,
      medications: 0,
      doctors: 0,
      appointments: 0,
      insurance: 0,
      shareAccesses: 0,
      s3Documents: 0,
    };

    // 1. Collect and delete S3 documents from MedicalHistory events
    const medHistory = await MedicalHistory.findOne({ userId: user._id });
    if (medHistory) {
      // Gather S3 keys from event documents
      const s3Keys = [];
      if (medHistory.events) {
        medHistory.events.forEach((event) => {
          if (event.documents) {
            event.documents.forEach((doc) => {
              if (doc.s3Key) {
                s3Keys.push(doc.s3Key);
              }
            });
          }
        });
      }

      // Delete S3 documents from insurance records
      const insuranceDocs = await Insurance.find({ userId: user._id });
      insuranceDocs.forEach((ins) => {
        if (ins.cardImages) {
          if (ins.cardImages.front) s3Keys.push(ins.cardImages.front);
          if (ins.cardImages.back) s3Keys.push(ins.cardImages.back);
        }
        if (ins.documents) {
          ins.documents.forEach((doc) => {
            if (doc.s3Key) s3Keys.push(doc.s3Key);
          });
        }
      });

      // Delete S3 files
      for (const key of s3Keys) {
        try {
          await documentService.deleteFile(key);
          deleteSummary.s3Documents++;
        } catch (s3Err) {
          console.error(`Failed to delete S3 object ${key}:`, s3Err.message);
        }
      }
    }

    // 2. Cascade delete all related data
    const [medResult, medxResult, docResult, apptResult, insResult, shareResult] =
      await Promise.all([
        MedicalHistory.deleteMany({ userId: user._id }),
        Medication.deleteMany({ userId: user._id }),
        Doctor.deleteMany({ patientId: user._id }),
        Appointment.deleteMany({ userId: user._id }),
        Insurance.deleteMany({ userId: user._id }),
        ShareAccess.deleteMany({ patientId: user._id }),
      ]);

    deleteSummary.medicalHistory = medResult.deletedCount;
    deleteSummary.medications = medxResult.deletedCount;
    deleteSummary.doctors = docResult.deletedCount;
    deleteSummary.appointments = apptResult.deletedCount;
    deleteSummary.insurance = insResult.deletedCount;
    deleteSummary.shareAccesses = shareResult.deletedCount;

    // 3. Delete the user
    await User.findByIdAndDelete(user._id);

    // Build human-readable summary
    const parts = ['Deleted 1 user'];
    if (deleteSummary.medicalHistory > 0) parts.push(`${deleteSummary.medicalHistory} medical history record(s)`);
    if (deleteSummary.medications > 0) parts.push(`${deleteSummary.medications} medication(s)`);
    if (deleteSummary.doctors > 0) parts.push(`${deleteSummary.doctors} doctor(s)`);
    if (deleteSummary.appointments > 0) parts.push(`${deleteSummary.appointments} appointment(s)`);
    if (deleteSummary.insurance > 0) parts.push(`${deleteSummary.insurance} insurance plan(s)`);
    if (deleteSummary.shareAccesses > 0) parts.push(`${deleteSummary.shareAccesses} share access(es)`);
    if (deleteSummary.s3Documents > 0) parts.push(`${deleteSummary.s3Documents} S3 document(s)`);

    res.json({
      success: true,
      message: parts.join(', '),
      deleteSummary,
    });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUserMedicalSummary,
  forcePasswordReset,
  forceEmailVerification,
  deactivateUser,
  reactivateUser,
  deleteUser,
};
