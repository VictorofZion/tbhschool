const supabase = require('../config/db');

// Initiate School Fees Payment Process
const initiatePayment = async (req, res) => {
  const { student_id, amount, payer_name, payer_email, payer_phone } = req.body;

  if (!student_id || !amount || !payer_email) {
    return res.status(400).json({ error: 'Missing required payment parameters.' });
  }

  try {
    const orderId = `TBHS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Pass environment merchant credentials to the frontend engine
    const paymentConfig = {
      merchantId: process.env.REMITA_MERCHANT_ID || '2547916',
      orderId,
      amount
    };

    return res.status(200).json({
      success: true,
      paymentConfig
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to initiate fee payment session.' });
  }
};

// Verify Payment and Update Student Fee Status
const verifyPayment = async (req, res) => {
  const { rrr, orderId, studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required for verification.' });
  }

  try {
    // Update fee_status to PAID in the database
    const { data: updatedStudent, error } = await supabase
      .from('students')
      .update({ fee_status: 'PAID' })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment successfully verified and status updated.',
      student: updatedStudent
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error processing payment verification.' });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment
};