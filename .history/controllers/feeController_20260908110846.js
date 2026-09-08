const supabase = require('../config/db');

// Get all class fees
const getAllClassFees = async (req, res) => {
  try {
    const { data: fees, error } = await supabase
      .from('class_fees')
      .select('*')
      .order('class_level', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true, fees });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve class fees.' });
  }
};

// Set or Update fee for a specific class level (Admin Only)
const setClassFee = async (req, res) => {
  const { class_level, amount } = req.body;

  if (!class_level || amount === undefined || amount < 0) {
    return res.status(400).json({ error: 'Valid class level and amount are required.' });
  }

  try {
    const { data, error } = await supabase
      .from('class_fees')
      .upsert({ class_level, amount, updated_at: new Date() }, { onConflict: 'class_level' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true, message: `Fee updated for ${class_level}`, fee: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update class fee.' });
  }
};

module.exports = { getAllClassFees, setClassFee };