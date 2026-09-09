const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

const generateRegNumber = () => {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `TBH/${year}/${randomDigits}`;
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) return res.status(500).json({ error: `Database Error: ${error.message}` });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    let studentInfo = null;
    if (user.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('id, reg_number, class_level, serial_number, fee_status') // Explicitly omit date_of_birth
        .eq('user_id', user.id)
        .maybeSingle();
      studentInfo = student;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'tbhs_super_secret_jwt_key_2026',
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
        avatar_url: user.avatar_url,
        student_id: studentInfo?.id || null,
        reg_number: studentInfo?.reg_number || 'N/A',
        class_level: studentInfo?.class_level || 'N/A',
        serial_number: studentInfo?.serial_number || 'N/A',
        fee_status: studentInfo?.fee_status || 'UNPAID'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

const createUser = async (req, res) => {
  const { full_name, email, password, role, avatar_url, reg_number, class_level, date_of_birth } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ full_name, email: cleanEmail, password: hashedPassword, role, avatar_url }])
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }
      return res.status(400).json({ error: userError.message });
    }

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
          date_of_birth: date_of_birth || null,
          fee_status: 'UNPAID'
        }]);

      if (studentError) {
        await supabase.from('users').delete().eq('id', user.id);
        return res.status(400).json({ error: `Failed to create student profile: ${studentError.message}` });
      }
    }

    return res.status(201).json({ success: true, message: 'User created successfully', user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { login, createUser };