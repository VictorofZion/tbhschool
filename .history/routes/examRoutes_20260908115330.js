const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { createExam, addQuestions, getExamsByClass, getExamQuestions, submitExam } = require('../controllers/examController');

router.use(authenticateUser);

router.post('/create', createExam);
router.post('/questions', addQuestions);
router.get('/class/:classLevel', getExamsByClass);
router.get('/questions/:examId', getExamQuestions);
router.post('/submit', submitExam);

module.exports = router;