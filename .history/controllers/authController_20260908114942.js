const supabase = require('../config/db');
const jwt = require('jsonwebtoken');
const { normalizeClassLevel } = require('../utils/formatters');

// Create User (Admin Only)
const createUser = async (req, res) => {
  const { full_name, email, password, avatar_url, role, reg_number, serial_number, class_level } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  try {
    const { data: user, error: uErr } = await supabase
      .from('users')
      .insert([{ full_name, email, password, avatar_url, role }])
      .select()
      .single();

    if (uErr) return res.status(400).json({ error: uErr.message });

    if (role === 'student') {
      const targetClass = normalizeClassLevel(class_level);
      await supabase.from('students').insert([{
        user_id: user.id,
        full_name,
        email,
        reg_number: reg_number || 'N/A',
        serial_number: serial_number || 'N/A',
        class_level: targetClass,
        fee_status: 'UNPAID'
      }]);
    }

    return res.status(201).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user account.' });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*, students(*)')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const studentData = (user.students && user.students[0]) ? user.students[0] : (user.students || {});

    const token = jwt.sign(
      { id: user.id, role: user.role, student_id: studentData.id },
      process.env.JWT_SECRET || 'tbhschool_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        student_id: studentData.id,
        class_level: studentData.class_level,
        reg_number: studentData.reg_number,
        serial_number: studentData.serial_number,
        fee_status: studentData.fee_status
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Authentication failed.' });
  }
};

module.exports = { createUser, loginUser };