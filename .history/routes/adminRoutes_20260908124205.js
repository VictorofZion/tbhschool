const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getUsers, updateUser, deleteUser } = require('../controllers/adminController');

router.use(authenticateUser);

router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;