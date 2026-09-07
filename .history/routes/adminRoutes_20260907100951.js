const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Example usage on an admin route:
router.get('/dashboard', authenticateUser, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Welcome Admin' });
});

module.exports = router;
// Import Controller Handlers
const { getUsers, updateUser, deleteUser, getDashboard } = require('../controllers/adminController');

// Ensure authorizeRoles is a valid callable function before route registration
if (typeof authorizeRoles !== 'function') {
  throw new Error('middleware/auth.js must export a valid authorizeRoles function.');
}

// Apply authentication and role authorization to all admin endpoints
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

// Admin Endpoints
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/dashboard', getDashboard);

module.exports = router;