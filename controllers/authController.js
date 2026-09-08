const supabase = require('../config/db');
const jwt = require('jsonwebtoken');
const { normalizeClassLevel } = require('../utils/formatters');

// User Login Handler
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*, students(*)')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) {
      console.error('Supabase Login Error:', error.message);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user || String(user.password).trim() !== cleanPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const studentData = (user.students && user.students.length > 0) 
      ? user.students[0] 
      : (user.students || {});

    const payload = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      student_id: studentData.id || null,
      class_level: normalizeClassLevel(studentData.class_level),
      reg_number: studentData.reg_number || null,
      serial_number: studentData.serial_number || null,
      fee_status: studentData.fee_status || 'UNPAID'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'tbhs_secret_jwt_key', { expiresIn: '12h' });

    return res.status(200).json({
      success: true,
      token,
      user: payload
    });
  } catch (err) {
    return res.status(500).json({ error: 'Authentication failed.' });
  }
};

// Admin Creates User Account
const createUser = async (req, res) => {
  const { full_name, email, password, role, avatar_url, reg_number, serial_number, class_level } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert([{
        full_name,
        email: cleanEmail,
        password: cleanPassword,
        role,
        avatar_url: avatar_url || 'https://via.placeholder.com/150'
      }])
      .select()
      .single();

    if (userErr) return res.status(400).json({ error: userErr.message });

    if (role === 'student') {
      const { error: stErr } = await supabase
        .from('students')
        .insert([{
          user_id: user.id,
          full_name,
          email: cleanEmail,
          reg_number: reg_number || 'N/A',
          serial_number: serial_number || 'N/A',
          class_level: normalizeClassLevel(class_level),
          fee_status: 'UNPAID'
        }]);

      if (stErr) {
        console.error('Student Profile Creation Warning:', stErr.message);
      }
    }

    return res.status(201).json({ success: true, message: 'Account created successfully.', user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user account.' });
  }
};

module.exports = { login, createUser };