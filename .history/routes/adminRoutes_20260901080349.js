const express = require('express');
const router = express.Router();

// Import Middleware
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Import Controller Handlers
const { getUsers, updateUser, deleteUser, getDashboard } = require('../controllers/adminController');

// Ensure authorizeRoles is a valid callable function before route registration
if (typeof authorizeRoles !== 'function') {
  throw new Error('middleware/auth.js must export a valid authorizeRoles function.');
}

// Apply authentication and role authorization to all admin endpoints
router.use(verifyToken);
router.use(authorizeRoles('admin'));

// Admin Endpoints
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/dashboard', getDashboard);

module.exports = router;