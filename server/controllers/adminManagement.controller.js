const Admin = require('../models/Admin');

// @desc    Get all admin accounts
// @route   GET /api/admin/management
// @access  Admin (canManageAdmins / super_admin)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error('Admin getAllAdmins error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new admin account (super_admin only)
// @route   POST /api/admin/management
// @access  Admin (canManageAdmins / super_admin)
const createAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, permissions } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, firstName, and lastName',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if email already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An admin with that email already exists',
      });
    }

    const adminData = {
      email,
      password,
      firstName,
      lastName,
      role: role || 'admin',
      createdBy: req.admin._id,
    };

    // If role is admin (not super_admin), apply custom permissions
    if (adminData.role === 'admin' && permissions) {
      adminData.permissions = {
        canManageUsers: !!permissions.canManageUsers,
        canViewMedicalData: !!permissions.canViewMedicalData,
        canManageAdmins: !!permissions.canManageAdmins,
        canViewAnalytics: !!permissions.canViewAnalytics,
        canResetPasswords: !!permissions.canResetPasswords,
      };
    }

    const admin = await Admin.create(adminData);

    // Return without password
    const adminResponse = await Admin.findById(admin._id).select('-password');

    res.status(201).json({
      success: true,
      message: `Admin account created for ${email}`,
      admin: adminResponse,
    });
  } catch (error) {
    console.error('Admin createAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update admin permissions, role, active status (super_admin only)
// @route   PUT /api/admin/management/:id
// @access  Admin (canManageAdmins / super_admin)
const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Prevent editing yourself via this endpoint
    if (admin._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Use the profile/password endpoints to edit your own account',
      });
    }

    const { role, permissions, isActive, firstName, lastName } = req.body;

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (role) admin.role = role;
    if (typeof isActive === 'boolean') admin.isActive = isActive;

    // Update permissions (only for non-super_admin, since super_admin gets all automatically)
    if (permissions && admin.role !== 'super_admin') {
      admin.permissions = {
        canManageUsers: !!permissions.canManageUsers,
        canViewMedicalData: !!permissions.canViewMedicalData,
        canManageAdmins: !!permissions.canManageAdmins,
        canViewAnalytics: !!permissions.canViewAnalytics,
        canResetPasswords: !!permissions.canResetPasswords,
      };
    }

    await admin.save();

    const updatedAdmin = await Admin.findById(admin._id).select('-password');

    res.json({
      success: true,
      message: `Admin ${admin.email} updated`,
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error('Admin updateAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Deactivate an admin account (super_admin only)
// @route   PUT /api/admin/management/:id/deactivate
// @access  Admin (canManageAdmins / super_admin)
const deactivateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Prevent deactivating yourself
    if (admin._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Admin is already deactivated',
      });
    }

    admin.isActive = false;
    await admin.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Admin ${admin.email} has been deactivated`,
    });
  } catch (error) {
    console.error('Admin deactivateAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deactivateAdmin,
};
