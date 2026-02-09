const express = require('express');
const router = express.Router();
const { adminProtect, adminAuthorize } = require('../middleware/adminAuth');
const {
  getAllUsers,
  getUserById,
  getUserMedicalSummary,
  forcePasswordReset,
  forceEmailVerification,
  deactivateUser,
  reactivateUser,
  deleteUser,
} = require('../controllers/adminUsers.controller');

// All routes require admin authentication
router.use(adminProtect);

// GET /api/admin/users - Paginated, searchable user list
router.get('/', adminAuthorize('canManageUsers'), getAllUsers);

// GET /api/admin/users/:id - User detail with data counts
router.get('/:id', adminAuthorize('canManageUsers'), getUserById);

// GET /api/admin/users/:id/medical - Full medical data (requires canViewMedicalData)
router.get('/:id/medical', adminAuthorize('canViewMedicalData'), getUserMedicalSummary);

// POST /api/admin/users/:id/reset-password - Force password reset (requires canResetPasswords)
router.post('/:id/reset-password', adminAuthorize('canResetPasswords'), forcePasswordReset);

// POST /api/admin/users/:id/verify-email - Force email verification (requires canResetPasswords)
router.post('/:id/verify-email', adminAuthorize('canResetPasswords'), forceEmailVerification);

// PUT /api/admin/users/:id/deactivate - Soft deactivate user
router.put('/:id/deactivate', adminAuthorize('canManageUsers'), deactivateUser);

// PUT /api/admin/users/:id/reactivate - Reactivate user
router.put('/:id/reactivate', adminAuthorize('canManageUsers'), reactivateUser);

// DELETE /api/admin/users/:id - Permanent delete with cascade
router.delete('/:id', adminAuthorize('canManageUsers'), deleteUser);

module.exports = router;
