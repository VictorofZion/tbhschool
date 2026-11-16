const express = require('express');
const router = express.Router();
const {
  getStudentsList,
  getResultsByStudent,
  getAllResults,
  uploadResult,
  updateResultScore,
  deleteResultScore
} = require('../controllers/academicController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// 1. Static routes MUST come BEFORE parameterized /:studentId routes!
router.get('/students', authenticateUser, getStudentsList);
router.get('/roster', authenticateUser, getStudentsList);
router.get('/results', authenticateUser, getResultsByStudent);
router.get('/my-results', authenticateUser, getResultsByStudent);
router.get('/results/all', authenticateUser, authorizeRoles('teacher'), getAllResults);

// 2. Parameterized student result lookup routes (covers all student-dashboard URL patterns)
router.get('/results/student/:studentId', authenticateUser, getResultsByStudent);
router.get('/results/:studentId', authenticateUser, getResultsByStudent);
router.get('/student/:studentId', authenticateUser, getResultsByStudent);

// 3. Grade upload, update, and deletion routes
router.post('/upload', authenticateUser, authorizeRoles('teacher'), uploadResult);
router.put('/result/:resultId', authenticateUser, authorizeRoles('teacher'), updateResultScore);
router.delete('/result/:resultId', authenticateUser, authorizeRoles('admin'), deleteResultScore);

module.exports = router;