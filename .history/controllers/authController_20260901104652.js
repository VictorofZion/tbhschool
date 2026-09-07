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
    // Join the users table with the students table
    const { data: user, error } = await supabase
      .from('users')
      .select('*, students(*)')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Invalid user account state. Please contact admin.' });
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

    // Extract nested student details if available
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
    console.error("Authentication Error Details:", err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};
const createUser = async (req, res) => {
  const { full_name, email, password, role, avatar_url, reg_number, serial_number, class_level } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create User Record
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

    // 2. If Role is Student, Create Student Record
    if (role === 'student') {
      // Generate fallback unique values if input fields were left empty
      const finalRegNum = reg_number && reg_number.trim() !== '' 
        ? reg_number.trim() 
        : `REG-${Date.now().toString().slice(-6)}`;

      const finalSerialNum = serial_number && serial_number.trim() !== '' 
        ? serial_number.trim() 
        : `SN-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error: studentError } = await supabase
        .from('students')
        .insert([{ 
          user_id: user.id, 
          reg_number: finalRegNum, 
          serial_number: finalSerialNum, 
          class_level: class_level || 'JSS 1' 
        }]);

      if (studentError) {
        // Rollback: delete orphaned user row if student creation fails
        await supabase.from('users').delete().eq('id', user.id);

        if (studentError.code === '23505') {
          return res.status(400).json({ 
            error: 'Student creation failed: Registration number or Serial number already exists in database.' 
          });
        }
        return res.status(400).json({ error: `Student profile error: ${studentError.message}` });
      }
    }

    return res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (err) {
    console.error("Create User Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
module.exports = {
  login,
  createUser
};