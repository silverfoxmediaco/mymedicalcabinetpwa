const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Generate admin JWT with separate secret and shorter expiry
const generateAdminToken = (adminId, role) => {
  return jwt.sign(
    { id: adminId, role, type: 'admin' },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRE || '8h' }
  );
};

// Protect admin routes - verify admin JWT
const adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - no admin token provided',
    });
  }

  try {
    // Verify with ADMIN secret (not user secret)
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    // Ensure it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'This route is for administrators only',
      });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found',
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin account is deactivated',
      });
    }

    if (admin.isAccountLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Admin account is temporarily locked due to failed login attempts',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin session has expired. Please login again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized - invalid admin token',
    });
  }
};

// Check admin has required permission flags
const adminAuthorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    // super_admin bypasses permission checks
    if (req.admin.role === 'super_admin') {
      return next();
    }

    const missingPermissions = permissions.filter(
      (p) => !req.admin.permissions[p]
    );

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Missing required permissions: ${missingPermissions.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { adminProtect, adminAuthorize, generateAdminToken };
