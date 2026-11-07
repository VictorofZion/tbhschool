const supabase = require('../config/db');

// Fetch all staff members for management dropdowns
const getAllStaff = async (req, res) => {
  try {
    const { data: staff, error } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .in('role', ['teacher', 'admin', 'chief_admin'])
      .order('full_name', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, staff: staff || [] });
  } catch (err) {
    console.error("Error fetching staff list:", err);
    return res.status(500).json({ error: 'Failed to fetch staff list.' });
  }
};

// Change user role (Chief Admin Exclusive)
const updateUserRole = async (req, res) => {
  const { targetUserId, newRole } = req.body;

  const validRoles = ['chief_admin', 'admin', 'teacher', 'student'];
  if (!validRoles.includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', targetUserId)
      .select('id, full_name, email, role')
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
};

module.exports = {
  getAllStaff,
  updateUserRole
};
