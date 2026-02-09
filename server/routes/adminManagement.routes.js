const express = require('express');
const router = express.Router();
const { adminProtect, adminAuthorize } = require('../middleware/adminAuth');
const {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deactivateAdmin,
} = require('../controllers/adminManagement.controller');

// All routes require admin authentication + canManageAdmins
router.use(adminProtect);
router.use(adminAuthorize('canManageAdmins'));

// GET /api/admin/management - List all admin accounts
router.get('/', getAllAdmins);

// POST /api/admin/management - Create new admin account
router.post('/', createAdmin);

// PUT /api/admin/management/:id - Update admin permissions/role/status
router.put('/:id', updateAdmin);

// PUT /api/admin/management/:id/deactivate - Deactivate admin account
router.put('/:id/deactivate', deactivateAdmin);

module.exports = router;
