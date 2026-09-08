const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { uploadMaterial, getMaterialsByClass } = require('../controllers/materialController');

router.use(authenticateUser);

router.post('/upload', uploadMaterial);
router.get('/class/:classLevel', getMaterialsByClass);

module.exports = router;