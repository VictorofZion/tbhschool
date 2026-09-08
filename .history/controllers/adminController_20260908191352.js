const supabase = require('../config/db');
const { normalizeClassLevel } = require('../utils/formatters');

// Fetch All System Users
const getUsers = async (req, res) => {
  const { role } = req.query;

  try {
    let query = supabase.from('users').select('*, students(*)');
    if (role) query = query.eq('role', role);

    const { data: users, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users.' });
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
        email: email.trim().toLowerCase(),
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
          full_name,
          email: email.trim().toLowerCase(),
          reg_number,
          serial_number,
          class_level: normalizeClassLevel(class_level)
        })
        .eq('user_id', id);
    }

    return res.status(200).json({ success: true, message: 'User updated successfully.', user });
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

module.exports = { getUsers, updateUser, deleteUser };