const express = require('express');
const router = express.Router();

// Destructure specific middleware function (do NOT import as an object)
const { verifyToken } = require('../middleware/auth');

// Destructure controller callback functions
const { getResultsByStudent, uploadResult, getStudentsList } = require('../controllers/academicController');

// Ensure verifyToken is a valid function before mounting
if (typeof verifyToken !== 'function') {
  throw new Error('middleware/auth.js must export a valid verifyToken function.');
}

// Apply authentication middleware to all academic routes
router.use(verifyToken);

// Academic Endpoints
router.get('/results/:studentId', getResultsByStudent);
router.post('/results', uploadResult);
router.get('/students-list', getStudentsList);

module.exports = router;