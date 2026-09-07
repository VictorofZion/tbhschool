require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./config/db');

async function resetPassword() {
  const adminEmail = 'ibidunvictor@gmail.com';
  const newPassword = 'YourNewPassword123!';

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { data, error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('email', adminEmail)
    .select();

  if (error) {
    console.error('Password reset failed:', error.message);
  } else {
    console.log('Admin password updated successfully for:', data[0].email);
  }
}

resetPassword();