const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

// Helper function to auto-generate a unique Registration Number
const generateRegNumber = () => {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `TBH/${year}/${randomDigits}`;
};

// 1. Login Handler with Supabase Relation Join
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Fetch user and join with students table via user_id foreign key
    const { data: user, error } = await supabase
      .from('users')
      .select('*, students(*)')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Normalize student record data
    const studentInfo = Array.isArray(user.students) ? user.students[0] : user.students;

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        student_id: studentInfo?.id || null,
        reg_number: studentInfo?.reg_number || 'N/A',
        class_level: studentInfo?.class_level || 'N/A',
        serial_number: studentInfo?.serial_number || 'N/A',
        fee_status: studentInfo?.fee_status || 'UNPAID'
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

// 2. Create User Handler (Auto Reg Number & Supabase Persistence)
const createUser = async (req, res) => {
  const { full_name, email, password, role, avatar_url, reg_number, class_level } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into 'users' table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ full_name, email, password: hashedPassword, role, avatar_url }])
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }
      return res.status(400).json({ error: userError.message });
    }

    // Insert into 'students' table if role is 'student'
    if (role === 'student') {
      const finalRegNum = reg_number && reg_number.trim() !== '' ? reg_number.trim() : generateRegNumber();
      const finalSerialNum = `SN-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error: studentError } = await supabase
        .from('students')
        .insert([{
          user_id: user.id,
          reg_number: finalRegNum,
          serial_number: finalSerialNum,
          class_level: class_level || 'JSS 1',
          fee_status: 'UNPAID'
        }]);

      if (studentError) {
        // Rollback user creation if student entry fails
        await supabase.from('users').delete().eq('id', user.id);
        return res.status(400).json({ error: `Failed to create student profile: ${studentError.message}` });
      }
    }

    return res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (err) {
    console.error("Create User Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { login, createUser };