const express = require('express');
const router = express.Router();

// Destructure required controller methods
const { login, createUser } = require('../controllers/authController');

// Ensure route callbacks are valid functions before mounting
if (typeof login !== 'function' || typeof createUser !== 'function') {
  throw new Error('authController must export valid login and createUser functions.');
}

// Mount endpoints
router.post('/login', login);
router.post('/create-user', createUser);

module.exports = router;