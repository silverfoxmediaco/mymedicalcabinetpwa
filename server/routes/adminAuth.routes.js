const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const {
  adminLogin,
  adminLogout,
  getAdminProfile,
  changeAdminPassword,
} = require('../controllers/adminAuth.controller');

// POST /api/admin/auth/login - Admin login (public)
router.post('/login', adminLogin);

// POST /api/admin/auth/logout - Admin logout (protected)
router.post('/logout', adminProtect, adminLogout);

// GET /api/admin/auth/me - Get current admin profile (protected)
router.get('/me', adminProtect, getAdminProfile);

// PUT /api/admin/auth/password - Change admin password (protected)
router.put('/password', adminProtect, changeAdminPassword);

module.exports = router;
