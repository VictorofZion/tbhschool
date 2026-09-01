const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const verifyToken = require('../middleware/auth');

// Protected Dashboard Overview Endpoint
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const { count: totalStudents, error: studentErr } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    const { count: totalCourses, error: courseErr } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (studentErr || courseErr) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve metrics from database.' });
    }

    res.status(200).json({
      success: true,
      totalStudents: totalStudents || 0,
      totalCourses: totalCourses || 0,
      requestedBy: req.user.email
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error processing admin dashboard request.' });
  }
});

module.exports = router;