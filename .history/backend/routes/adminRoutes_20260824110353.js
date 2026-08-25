const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, updateFeeStatus } = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Protect all admin routes with Admin role check
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/users', getAllUsers);
router.delete('/users/:userId', deleteUser);
router.patch('/students/:studentId/fee-status', updateFeeStatus);

module.exports = router;