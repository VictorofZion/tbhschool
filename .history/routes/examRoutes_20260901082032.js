const express = require('express');
const router = express.Router();

// Import authentication middleware
const { verifyToken } = require('../middleware/auth');

// Import exam controller functions
const { createExam, addQuestions, getExamsByClass, submitExam } = require('../controllers/examController');

// Verify import integrity before route mounting
if (typeof createExam !== 'function' || typeof addQuestions !== 'function' || typeof submitExam !== 'function') {
  throw new Error('controllers/examController.js must export valid createExam, addQuestions, and submitExam functions.');
}

if (typeof verifyToken !== 'function') {
  throw new Error('middleware/auth.js must export a valid verifyToken function.');
}

// Apply authentication middleware to all exam routes
router.use(verifyToken);

// Exam Endpoints
router.post('/create', createExam);
router.post('/add-questions', addQuestions);
router.get('/class/:classLevel', getExamsByClass);
router.post('/submit', submitExam);

module.exports = router;