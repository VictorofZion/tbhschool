const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

// Unified Login for Admin, Teachers, and Students
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // 1. Check if user exists in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 2. Validate password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 3. Fetch extra profile details if student
    let studentProfile = null;
    if (user.role === 'student') {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();
      studentProfile = studentData;
    }

    // 4. Issue JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        studentProfile
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during authentication." });
  }
};

// Admin Route: Add New Users (Teachers and Students)
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role, reg_number, class_level } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: "All required user fields must be supplied." });
    }

    // Hash the account password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user into main users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ full_name, email, password_hash, role }])
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    // If role is student, also insert into student profiles table
    if (role === 'student') {
      if (!reg_number || !class_level) {
        return res.status(400).json({ error: "Registration number and class level are required for student accounts." });
      }

      const { error: studentError } = await supabase
        .from('students')
        .insert([{ user_id: user.id, reg_number, class_level }]);

      if (studentError) {
        return res.status(400).json({ error: studentError.message });
      }
    }

    res.status(201).json({ message: `${role} user created successfully!`, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: "Server error during account creation." });
  }
};

module.exports = { login, createUser };