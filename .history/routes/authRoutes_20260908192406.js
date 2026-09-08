const express = require('express');
const router = express.Router();
const { login, createUser } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');

router.post('/login', login);
router.post('/create-user', authenticateUser, createUser);

module.exports = router;