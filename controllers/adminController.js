const supabase = require('../config/db');

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, class_level, reg_number, fee_status } = req.body;

  try {
    // 1. Update user record in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .update({ full_name, email, role })
      .eq('id', id)
      .select()
      .single();

    if (userError) return res.status(400).json({ error: userError.message });

    // 2. Update associated student record in Supabase
    if (role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .update({ class_level, reg_number, fee_status })
        .eq('user_id', id);

      if (studentError) return res.status(400).json({ error: studentError.message });
    }

    return res.status(200).json({ success: true, message: 'User and student details updated successfully in Supabase.', user });
  } catch (err) {
    console.error("Update User Error:", err);
    return res.status(500).json({ error: 'Failed to update user record.' });
  }
};

module.exports = { updateUser };