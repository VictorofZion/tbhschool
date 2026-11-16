const express = require('express');
const router = express.Router();
const { login, createUser, verifyPasswordRecheck } = require('../controllers/authController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

router.post('/login', login);
router.post('/create-user', authenticateUser, authorizeRoles('admin'), createUser);
router.post('/verify-password', authenticateUser, verifyPasswordRecheck);

module.exports = router;