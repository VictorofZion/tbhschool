const express = require('express');
const router = express.Router();
const { getAllStaff, updateUserRole } = require('../controllers/userController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Get list of staff users (Admin & Chief Admin authorized)
router.get('/staff', authenticateUser, authorizeRoles('admin'), getAllStaff);

// Update user role (Chief Admin Exclusive)
router.put('/change-role', authenticateUser, authorizeRoles('chief_admin'), updateUserRole);

module.exports = router;
