const Admin = require('../models/Admin');
const { generateAdminToken } = require('../middleware/adminAuth');

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find admin and include password field
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated. Contact a super admin.',
      });
    }

    // Check if account is locked
    if (admin.isAccountLocked()) {
      const remainingMs = admin.lockUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is locked due to too many failed attempts. Try again in ${remainingMin} minutes.`,
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      await admin.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Successful login - reset attempts and update lastLogin
    await admin.resetLoginAttempts();
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = generateAdminToken(admin._id, admin.role);

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

// @desc    Admin logout (client-side token removal, server acknowledgment)
// @route   POST /api/admin/auth/logout
// @access  Private (admin)
const adminLogout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove the admin token.',
  });
};

// @desc    Get current admin profile
// @route   GET /api/admin/auth/me
// @access  Private (admin)
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/auth/password
// @access  Private (admin)
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const admin = await Admin.findById(req.admin._id).select('+password');

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    admin.password = newPassword;
    await admin.save();

    // Generate new token after password change
    const token = generateAdminToken(admin._id, admin.role);

    res.json({
      success: true,
      message: 'Password updated successfully',
      token,
    });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  getAdminProfile,
  changeAdminPassword,
};
