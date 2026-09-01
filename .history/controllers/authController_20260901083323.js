const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

// User Login Handler
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Defensive check: ensure the database user record contains a password hash
    if (!user.password) {
      console.error(`User record for ${email} is missing a password hash in Supabase.`);
      return res.status(400).json({ error: 'Invalid user account state. Please contact admin.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment variables.");
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error("Authentication Error Details:", err);
    return res.status(500).json({ error: 'Internal server error during authentication.', details: err.message });
  }
};

const createUser = async (req, res) => {
  const { full_name, email, password, role, avatar_url, reg_number, serial_number, class_level } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ full_name, email, password: hashedPassword, role, avatar_url }])
      .select()
      .single();

    if (userError) return res.status(400).json({ error: userError.message });

    if (role === 'student') {
      const { error: studentError } = await supabase
        .from('students')
        .insert([{ user_id: user.id, reg_number, serial_number, class_level }]);

      if (studentError) return res.status(400).json({ error: studentError.message });
    }

    return res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Create User Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  login,
  createUser
};