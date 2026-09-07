const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { createAssignment, getAssignmentsByClass, submitAssignment } = require('../controllers/assignmentController');

router.use(authenticateUser);

router.post('/create', createAssignment);
router.get('/class/:classLevel', getAssignmentsByClass);
router.post('/submit', submitAssignment);

module.exports = router;