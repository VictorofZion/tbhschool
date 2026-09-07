const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { initiatePayment, verifyPayment } = require('../controllers/paymentController');

router.use(authenticateUser);

router.post('/initiate', initiatePayment);
router.post('/verify', verifyPayment);

module.exports = router;