const express = require('express');
const router = express.Router();
const { adminProtect, adminAuthorize } = require('../middleware/adminAuth');
const {
  getSystemStats,
  getRecentRegistrations,
} = require('../controllers/adminStats.controller');

// All routes require admin authentication + canViewAnalytics
router.use(adminProtect);

// GET /api/admin/stats - Platform-wide statistics
router.get('/', adminAuthorize('canViewAnalytics'), getSystemStats);

// GET /api/admin/stats/recent-registrations - Last 20 signups
router.get('/recent-registrations', adminAuthorize('canViewAnalytics'), getRecentRegistrations);

module.exports = router;
