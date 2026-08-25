const supabase = require('../config/db');

// Get all users (with optional role filter)
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query; // e.g., /api/admin/users?role=student

    let query = supabase.from('users').select('id, full_name, email, role, created_at');

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching users." });
  }
};

// Delete a user (Teacher or Student)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Server error deleting user." });
  }
};

// Update Student Fee Status (PAID, PARTIAL, UNPAID)
const updateFeeStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { fee_status } = req.body;

    if (!['PAID', 'PARTIAL', 'UNPAID'].includes(fee_status)) {
      return res.status(400).json({ error: "Invalid status. Must be PAID, PARTIAL, or UNPAID." });
    }

    const { data, error } = await supabase
      .from('students')
      .update({ fee_status })
      .eq('id', studentId)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Student fee status updated.", student: data });
  } catch (err) {
    res.status(500).json({ error: "Server error updating fee status." });
  }
};

module.exports = { getAllUsers, deleteUser, updateFeeStatus };