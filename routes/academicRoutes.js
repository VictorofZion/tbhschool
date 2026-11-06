const express = require('express');
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
