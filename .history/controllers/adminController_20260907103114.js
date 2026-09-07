const supabase = require('../config/db');

// Get Admin Dashboard Overview
const getDashboard = async (req, res) => {
  try {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true });

    return res.status(200).json({
      success: true,
      stats: { totalUsers: totalUsers || 0, totalStudents: totalStudents || 0 }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load admin dashboard.' });
  }
};

// Fetch All Registered Users
const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, created_at, students(*)');

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users list.' });
  }
};

// Update User & Associated Student Details
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, class_level, reg_number, fee_status } = req.body;

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({ full_name, email, role })
      .eq('id', id)
      .select()
      .single();

    if (userError) return res.status(400).json({ error: userError.message });

    if (role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .update({ class_level, reg_number, fee_status })
        .eq('user_id', id);

      if (studentError) return res.status(400).json({ error: studentError.message });
    }

    return res.status(200).json({ success: true, message: 'User updated successfully.', user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user record.' });
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

module.exports = {
  getDashboard,
  getUsers,
  updateUser,
  deleteUser
};