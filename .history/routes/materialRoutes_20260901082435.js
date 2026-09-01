const express = require('express');
const router = express.Router();

// Import authentication middleware
const { verifyToken } = require('../middleware/auth');

// Import material controller functions
const { uploadMaterial, getMaterialsByClass } = require('../controllers/materialController');

// Verify import integrity before route mounting
if (typeof uploadMaterial !== 'function' || typeof getMaterialsByClass !== 'function') {
  throw new Error('controllers/materialController.js must export valid uploadMaterial and getMaterialsByClass functions.');
}

if (typeof verifyToken !== 'function') {
  throw new Error('middleware/auth.js must export a valid verifyToken function.');
}

// Apply authentication middleware to all material routes
router.use(verifyToken);

// Material Endpoints
router.post('/upload', uploadMaterial);
router.get('/class/:classLevel', getMaterialsByClass);

module.exports = router;