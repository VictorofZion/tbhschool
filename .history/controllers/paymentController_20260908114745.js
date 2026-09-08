const supabase = require('../config/db');
const { normalizeClassLevel } = require('../utils/formatters');

// 1. Initialize Paystack Transaction
const initiatePayment = async (req, res) => {
  const { student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required.' });
  }

  try {
    // Fetch student record
    const { data: student, error: stErr } = await supabase
      .from('students')
      .select('id, full_name, email, class_level')
      .eq('id', student_id)
      .single();

    if (stErr || !student) return res.status(404).json({ error: 'Student record not found.' });

    // Normalize student class level before querying class_fees
    const normalizedClass = normalizeClassLevel(student.class_level);

    // Fetch fee amount for student's normalized class level
    const { data: feeConfig, error: feeErr } = await supabase
      .from('class_fees')
      .select('amount')
      .eq('class_level', normalizedClass)
      .single();

    if (feeErr || !feeConfig || feeConfig.amount <= 0) {
      return res.status(400).json({ error: `No fee amount configured for class level: ${normalizedClass}` });
    }

    const feeInNaira = feeConfig.amount;
    const amountInKobo = Math.round(feeInNaira * 100); // Paystack expects amount in kobo

    // Call Paystack Initialize API
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: student.email || `${student.id}@tbhschool.edu.ng`,
        amount: amountInKobo,
        metadata: {
          student_id: student.id,
          class_level: normalizedClass
        }
      })
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      return res.status(400).json({ error: paystackData.message || 'Failed to initialize Paystack gateway.' });
    }

    return res.status(200).json({
      success: true,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      amount: feeInNaira
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error initializing payment.' });
  }
};

// 2. Verify Paystack Transaction
const verifyPayment = async (req, res) => {
  const { reference, studentId } = req.body;

  if (!reference || !studentId) {
    return res.status(400).json({ error: 'Transaction reference and Student ID are required.' });
  }

  try {
    // Verify with Paystack Server
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = await response.json();

    if (data.status && data.data.status === 'success') {
      // Update student fee status in Supabase
      const { data: student, error } = await supabase
        .from('students')
        .update({ fee_status: 'PAID' })
        .eq('id', studentId)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ success: true, message: 'Payment verified successfully.', student });
    } else {
      return res.status(400).json({ error: data.data?.gateway_response || 'Payment verification failed.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error during payment verification.' });
  }
};

module.exports = { initiatePayment, verifyPayment };