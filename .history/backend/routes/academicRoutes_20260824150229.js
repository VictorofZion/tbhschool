const express = require('express');
const router = express.Router();
const { uploadResult, getStudentResults } = require('../controllers/academicController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Teachers & Admins can upload results
router.post('/results', authenticateToken, authorizeRoles('teacher', 'admin'), uploadResult);

// Students, Teachers, and Admins can view results
router.get('/results/:studentId', authenticateToken, authorizeRoles('student', 'teacher', 'admin'), getStudentResults);

router.get('/students-list', authenticateToken, authorizeRoles('teacher', 'admin'), getStudentsList);

module.exports = router;