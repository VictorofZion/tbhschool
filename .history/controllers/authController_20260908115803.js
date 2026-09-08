const supabase = require('../config/db');
const jwt = require('jsonwebtoken');
const { normalizeClassLevel } = require('../utils/formatters');

// 1. Create User (Admin Only)
const createUser = async (req, res) => {
  const { full_name, email, password, avatar_url, role, reg_number, serial_number, class_level } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    const { data: user, error: uErr } = await supabase
      .from('users')
      .insert([{ full_name, email: cleanEmail, password: password.trim(), avatar_url, role }])
      .select()
      .single();

    if (uErr) return res.status(400).json({ error: uErr.message });

    if (role === 'student') {
      const targetClass = normalizeClassLevel(class_level);
      await supabase.from('students').insert([{
        user_id: user.id,
        full_name,
        email: cleanEmail,
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

// 2. Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Query user record using case-insensitive email matching and maybeSingle()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', cleanEmail)
      .eq('password', cleanPassword)
      .maybeSingle();

    if (userError) {
      return res.status(500).json({ error: `Database error: ${userError.message}` });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    let studentData = {};

    // Fetch student record separately if user role is student
    if (user.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (student) studentData = student;
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role, student_id: studentData.id || null },
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
        student_id: studentData.id || null,
        class_level: studentData.class_level || null,
        reg_number: studentData.reg_number || null,
        serial_number: studentData.serial_number || null,
        fee_status: studentData.fee_status || null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Authentication processing failed.' });
  }
};

module.exports = { createUser, loginUser };