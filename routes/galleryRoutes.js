const express = require('express');
const router = express.Router();
const { getGalleryImages, addGalleryImage } = require('../controllers/galleryController');
const { authenticateUser, authorizeRoles } = require('../middleware/auth');

// Public route to view gallery
router.get('/', getGalleryImages);

// Admin / Teacher route to add photos
router.post('/upload', authenticateUser, authorizeRoles('admin', 'teacher'), addGalleryImage);

module.exports = router;
