const supabase = require('../config/db');

const initiatePayment = async (req, res) => {
  const { student_id, payer_name, payer_email } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required.' });
  }

  try {
    // 1. Fetch student's class level
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('class_level')
      .eq('id', student_id)
      .maybeSingle();

    if (studentErr || !student) {
      return res.status(400).json({ error: 'Student profile not found.' });
    }

    // 2. Lookup dynamic class fee amount
    const { data: classFee } = await supabase
      .from('class_fees')
      .select('amount')
      .eq('class_level', student.class_level)
      .maybeSingle();

    const finalAmount = classFee ? parseFloat(classFee.amount) : 150000;
    const orderId = `TBHS_FEE_${Date.now()}`;

    return res.status(200).json({
      success: true,
      paymentConfig: {
        merchantId: process.env.REMITA_MERCHANT_ID || "2547916",
        serviceTypeId: process.env.REMITA_SERVICE_TYPE_ID || "4430731",
        orderId,
        amount: finalAmount,
        payerName: payer_name,
        payerEmail: payer_email
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to initiate fee payment.' });
  }
};

const verifyPayment = async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required.' });
  }

  try {
    const { error } = await supabase
      .from('students')
      .update({ fee_status: 'PAID' })
      .eq('id', studentId);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ success: true, message: 'Fee payment verified and certified.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record payment verification.' });
  }
};

module.exports = { initiatePayment, verifyPayment };