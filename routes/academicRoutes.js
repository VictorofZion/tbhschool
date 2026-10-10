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

module.exports = router;
