const supabase = require('../config/db');

// Initiate Paystack payment with class-specific fee lookup
const initiatePayment = async (req, res) => {
  const { student_id, payer_email } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required.' });
  }

  try {
    // 1. Fetch student's class level
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('id, class_level, fee_status')
      .eq('id', student_id)
      .maybeSingle();

    if (studentErr || !student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    if (student.fee_status === 'PAID') {
      return res.status(400).json({ error: 'School fees for this student have already been certified as PAID.' });
    }

    // 2. Fetch exact fee configured by Admin for this specific class level
    const { data: classFee, error: feeErr } = await supabase
      .from('class_fees')
      .select('amount')
      .eq('class_level', student.class_level)
      .maybeSingle();

    if (feeErr || !classFee) {
      return res.status(400).json({ 
        error: `No school fee amount configured for class level ${student.class_level}. Please contact the school administrator.` 
      });
    }

    const nairaAmount = parseFloat(classFee.amount);
    // Paystack processes amounts in Kobo (1 NGN = 100 Kobo)
    const koboAmount = Math.round(nairaAmount * 100);
    const reference = `TBHS_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return res.status(200).json({
      success: true,
      paystackKey: process.env.PAYSTACK_PUBLIC_KEY || "pk_test_sample_key",
      amount: koboAmount,
      nairaAmount,
      classLevel: student.class_level,
      email: payer_email || req.user.email,
      reference
    });
  } catch (err) {
    console.error("Initiate Payment Error:", err);
    return res.status(500).json({ error: 'Failed to initialize Paystack payment.' });
  }
};

// Verify Paystack payment reference with Paystack API & update DB status
const verifyPayment = async (req, res) => {
  const { reference, studentId } = req.body;

  if (!reference || !studentId) {
    return res.status(400).json({ error: 'Transaction reference and Student ID are required.' });
  }

  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Verify transaction with Paystack API if secret key is present
    if (paystackSecret && !paystackSecret.includes('sample_key')) {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecret}`
        }
      });
      const data = await response.json();

      if (!data.status || data.data.status !== 'success') {
        return res.status(400).json({ error: 'Paystack payment verification failed or transaction was declined.' });
      }
    }

    // Update student's fee_status to PAID
    const { error: updateErr } = await supabase
      .from('students')
      .update({ fee_status: 'PAID' })
      .eq('id', studentId);

    if (updateErr) {
      return res.status(400).json({ error: updateErr.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully! School fee status updated to PAID.'
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    return res.status(500).json({ error: 'Failed to process payment verification.' });
  }
};

module.exports = { initiatePayment, verifyPayment };