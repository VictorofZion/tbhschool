const supabase = require('../config/db');
const { normalizeClassLevel } = require('../utils/formatters');

// Fetch All System Users
const getUsers = async (req, res) => {
  const { role } = req.query;

  try {
    let query = supabase.from('users').select('id, full_name, email, role, avatar_url, created_at');
    if (role) query = query.eq('role', role);

    const { data: users, error: userErr } = await query;
    if (userErr) return res.status(400).json({ error: userErr.message });

    // Fetch student profile records separately to avoid PostgREST relationship errors
    const { data: students, error: stErr } = await supabase.from('students').select('*');
    if (stErr) console.warn('Could not load student records:', stErr.message);

    const studentMap = new Map((students || []).map(s => [s.user_id, s]));

    const enrichedUsers = (users || []).map(u => ({
      ...u,
      students: studentMap.has(u.id) ? [studentMap.get(u.id)] : []
    }));

    return res.status(200).json({ success: true, users: enrichedUsers });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to fetch users.' });
  }
};

// Update User Profile
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, avatar_url, role, reg_number, serial_number, class_level } = req.body;

  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .update({
        full_name,
        email: String(email).trim().toLowerCase(),
        avatar_url
      })
      .eq('id', id)
      .select()
      .single();

    if (userErr) return res.status(400).json({ error: userErr.message });

    if (role === 'student') {
      await supabase
        .from('students')
        .update({
          email: String(email).trim().toLowerCase(),
          reg_number,
          serial_number,
          class_level: normalizeClassLevel(class_level)
        })
        .eq('user_id', id);
    }

    return res.status(200).json({ success: true, message: 'User updated successfully.', user });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to update user profile.' });
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
    return res.status(500).json({ error: err.message || 'Failed to delete user.' });
  }
};

module.exports = { getUsers, updateUser, deleteUser };