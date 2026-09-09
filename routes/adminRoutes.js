const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { 
  getUsers, 
  updateUser, 
  deleteUser, 
  getDashboard, 
  getClassFees, 
  updateClassFee 
} = require('../controllers/adminController');

router.use(authenticateUser);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/fees', getClassFees);
router.post('/fees', updateClassFee);

module.exports = router;