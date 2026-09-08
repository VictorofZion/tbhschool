const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getAllClassFees, setClassFee } = require('../controllers/feeController');

router.use(authenticateUser);

router.get('/', getAllClassFees);
router.post('/set', setClassFee);

module.exports = router;