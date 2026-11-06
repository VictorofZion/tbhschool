/*const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { 
  getStudentsList, 
  getResultsByStudent, 
  uploadResult 
} = require('../controllers/academicController');

router.use(authenticateUser);

// Academic management routes
router.get('/students-list', getStudentsList);
router.post('/results', uploadResult);
router.get('/results/student/:studentId', getResultsByStudent);
// Result management routes
router.put('/result/:resultId', authenticateUser, authorizeRoles('admin', 'teacher'), updateResultScore);
router.delete('/result/:resultId', authenticateUser, authorizeRoles('chief_admin', 'admin'), deleteResultScore);

module.exports = router;
*/


const express = require('express');
const router = express.Router();

// Controllers
const { 
  getStudentsList, 
  getResultsByStudent, 
  uploadResult,
  updateResultScore,
  deleteResultScore
} = require('../controllers/academicController');

// Middleware (Ensure BOTH authenticateUser AND authorizeRoles are imported)
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Public or student routes
router.get('/students', authenticateUser, getStudentsList);
router.get('/student/:studentId', authenticateUser, getResultsByStudent);

// Teacher and Admin grade upload / edit routes
// routes/academicRoutes.js
// 'teacher' minimum requirement -> Admins and Chief Admins are automatically allowed
router.post('/upload', authenticateUser, authorizeRoles('teacher'), uploadResult);
router.put('/result/:resultId', authenticateUser, authorizeRoles('teacher'), updateResultScore);

// Exclusive action -> Only Admins & Chief Admins
router.delete('/result/:resultId', authenticateUser, authorizeRoles('admin'), deleteResultScore);

module.exports = router;
