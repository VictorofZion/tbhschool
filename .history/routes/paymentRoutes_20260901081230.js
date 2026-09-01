const express = require('express');
const router = express.Router();

// Import authentication middleware
const { verifyToken } = require('../middleware/auth');

// Import payment controller functions
const { initiatePayment, verifyPayment } = require('../controllers/paymentController');

// Verify import integrity before route mounting
if (typeof initiatePayment !== 'function' || typeof verifyPayment !== 'function') {
  throw new Error('controllers/paymentController.js must export valid initiatePayment and verifyPayment functions.');
}

if (typeof verifyToken !== 'function') {
  throw new Error('middleware/auth.js must export a valid verifyToken function.');
}

// Apply authentication middleware to all payment routes
router.use(verifyToken);

// Payment Endpoints
router.post('/initiate', initiatePayment);
router.post('/verify', verifyPayment);

module.exports = router;
