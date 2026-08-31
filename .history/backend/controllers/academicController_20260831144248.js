const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const verifyToken = require('../middleware/auth');

// Fetch All Courses Endpoint
router.get('/courses', verifyToken, async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*');

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(200).json({
      success: true,
      courses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve academic courses.' });
  }
});

module.exports = router;