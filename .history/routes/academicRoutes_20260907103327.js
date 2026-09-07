const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getResultsByStudent, uploadResult, getStudentsList } = require('../controllers/academicController');

router.use(authenticateUser);

router.get('/results/:studentId', getResultsByStudent);
router.post('/results', uploadResult);
router.get('/students-list', getStudentsList);

module.exports = router;