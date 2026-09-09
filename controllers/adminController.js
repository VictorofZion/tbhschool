const supabase = require('../config/db');

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

const getUsers = async (req, res) => {
  const { role } = req.query;

  try {
    let query = supabase
      .from('users')
      .select('id, full_name, email, role, avatar_url, created_at, students!user_id(id, class_level, reg_number, serial_number, fee_status, date_of_birth)');

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, users: users || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users list.' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, avatar_url, class_level, reg_number, serial_number, date_of_birth } = req.body;

  try {
    const updateData = { full_name, email, role };
    if (avatar_url) updateData.avatar_url = avatar_url;

    const { data: user, error: userError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (userError) return res.status(400).json({ error: userError.message });

    if (role === 'student') {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', id)
        .maybeSingle();

      const cleanDOB = (date_of_birth && String(date_of_birth).trim() !== '') ? date_of_birth : null;

      if (existingStudent) {
        const { error: studentError } = await supabase
          .from('students')
          .update({ class_level, reg_number, serial_number, date_of_birth: cleanDOB })
          .eq('user_id', id);

        if (studentError) return res.status(400).json({ error: studentError.message });
      } else {
        const { error: studentError } = await supabase
          .from('students')
          .insert([{
            user_id: id,
            class_level: class_level || 'JSS 1',
            reg_number: reg_number || 'N/A',
            serial_number: serial_number || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
            date_of_birth: cleanDOB,
            fee_status: 'UNPAID'
          }]);

        if (studentError) return res.status(400).json({ error: studentError.message });
      }
    }

    return res.status(200).json({ success: true, message: 'User updated successfully.', user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user record.' });
  }
};

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