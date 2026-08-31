const express = require('express');
const router = express.Router();

// Import controller functions (names must match authController exports)
const { login, createUser } = require('../controllers/authController');

// Define API Route Handlers
router.post('/login', login);
router.post('/create-user', createUser);

module.exports = router;