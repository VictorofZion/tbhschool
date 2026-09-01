const express = require('express');
const router = express.Router();

// Import authentication middleware
const { verifyToken } = require('../middleware/auth');

// Import assignment controller functions
const { createAssignment, getAssignmentsByClass, submitAssignment } = require('../controllers/assignmentController');

// Verify import integrity before route mounting
if (typeof createAssignment !== 'function' || typeof submitAssignment !== 'function') {
  throw new Error('controllers/assignmentController.js must export valid createAssignment and submitAssignment functions.');
}

if (typeof verifyToken !== 'function') {
  throw new Error('middleware/auth.js must export a valid verifyToken function.');
}

// Apply authentication middleware to all assignment routes
router.use(verifyToken);

// Assignment Endpoints
router.post('/create', createAssignment);
router.get('/class/:classLevel', getAssignmentsByClass);
router.post('/submit', submitAssignment);

module.exports = router;