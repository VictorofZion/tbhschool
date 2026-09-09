const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const {
  createExam,
  addQuestions,
  getExamsByClass,
  getExamQuestions,
  submitExam
} = require('../controllers/examController');

router.use(authenticateUser);

router.post('/create', authorizeRoles('teacher', 'admin'), createExam);
router.post('/add-questions', authorizeRoles('teacher', 'admin'), addQuestions);
router.get('/class/:classLevel', getExamsByClass);
router.get('/:examId/questions', getExamQuestions);
router.post('/submit', submitExam);

module.exports = router;