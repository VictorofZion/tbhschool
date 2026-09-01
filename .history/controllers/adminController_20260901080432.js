const supabase = require('../config/db');

// Get All Users (with optional role filter)
const getUsers = async (req, res) => {
  const { role } = req.query;
  try {
    let query = supabase.from('users').select('*, students(*)');
    if (role) query = query.eq('role', role);

    const { data: users, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve user records.' });
  }
};

// Update User Profile & Student Record
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, avatar_url, role, reg_number, serial_number, class_level } = req.body;

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({ full_name, email, avatar_url, role })
      .eq('id', id)
      .select()
      .single();

    if (userError) return res.status(400).json({ error: userError.message });

    if (role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .update({ reg_number, serial_number, class_level })
        .eq('user_id', id);

      if (studentError) return res.status(400).json({ error: studentError.message });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user profile.' });
  }
};

// Delete User Account
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
};

// Dashboard Overview Metrics
const getDashboard = async (req, res) => {
  try {
    const { count: totalStudents, error: sErr } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: totalCourses, error: cErr } = await supabase.from('exams').select('*', { count: 'exact', head: true });

    if (sErr || cErr) return res.status(500).json({ error: 'Failed to load dashboard stats.' });

    return res.status(200).json({ success: true, totalStudents: totalStudents || 0, totalCourses: totalCourses || 0 });
  } catch (err) {
    return res.status(500).json({ error: 'Server error processing metrics.' });
  }
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  getDashboard
};