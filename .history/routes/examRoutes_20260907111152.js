const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { createExam, addQuestions, getExamsByClass, submitExam, getExamQuestions } = require('../controllers/examController');

router.use(authenticateUser);

router.post('/create', createExam);
router.post('/add-questions', addQuestions);
router.get('/class/:classLevel', getExamsByClass);
router.get('/:examId/questions', getExamQuestions);
router.post('/submit', submitExam);

module.exports = router;git 