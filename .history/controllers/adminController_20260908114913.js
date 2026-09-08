const supabase = require('../config/db');
const { normalizeClassLevel } = require('../utils/formatters');

// Get all users
const getAllUsers = async (req, res) => {
  const { role } = req.query;

  try {
    let query = supabase.from('users').select('*, students(*)');
    if (role) query = query.eq('role', role);

    const { data: users, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user accounts.' });
  }
};

// Update User Profile
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, avatar_url, role, reg_number, serial_number, class_level } = req.body;

  try {
    const { data: updatedUser, error: uErr } = await supabase
      .from('users')
      .update({ full_name, email, avatar_url })
      .eq('id', id)
      .select()
      .single();

    if (uErr) return res.status(400).json({ error: uErr.message });

    if (role === 'student') {
      const targetClass = normalizeClassLevel(class_level);
      await supabase
        .from('students')
        .update({ reg_number, serial_number, class_level: targetClass })
        .eq('user_id', id);
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user account.' });
  }
};

// Delete User Profile
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user account.' });
  }
};

module.exports = { getAllUsers, updateUser, deleteUser };