const crypto = require('crypto');
const supabase = require('../config/db');

// 1. Initiate Remita Payment Setup
const initiatePayment = async (req, res) => {
  const { student_id, amount, payer_name, payer_email, payer_phone } = req.body;

  if (!student_id || !amount || !payer_email) {
    return res.status(400).json({ error: 'Student ID, amount, and payer email are required.' });
  }

  try {
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID;
    const apiKey = process.env.REMITA_API_KEY;
    const orderId = `TBH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Generate SHA-512 Hash: SHA512(merchantId + serviceTypeId + orderId + amount + apiKey)
    const rawString = `${merchantId}${serviceTypeId}${orderId}${amount}${apiKey}`;
    const apiHash = crypto.createHash('sha512').update(rawString).digest('hex');

    return res.status(200).json({
      success: true,
      paymentConfig: {
        merchantId,
        serviceTypeId,
        orderId,
        amount,
        apiHash,
        payerName: payer_name,
        payerEmail: payer_email,
        payerPhone: payer_phone || '08000000000'
      }
    });
  } catch (err) {
    console.error("Payment Initiation Error:", err);
    return res.status(500).json({ error: 'Failed to generate Remita payment transaction details.' });
  }
};

// 2. Verify Remita Transaction and Update Supabase
const verifyPayment = async (req, res) => {
  const { rrr, orderId, studentId } = req.body;

  if (!studentId || !rrr) {
    return res.status(400).json({ error: 'Student ID and Remita RRR are required for verification.' });
  }

  try {
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const apiKey = process.env.REMITA_API_KEY;
    const baseUrl = process.env.REMITA_BASE_URL || 'https://remitademo.net';

    // Generate Verification Hash: SHA512(rrr + apiKey + merchantId)
    const hashString = `${rrr}${apiKey}${merchantId}`;
    const verificationHash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Query Remita Status API
    const response = await fetch(`${baseUrl}/payment/api/v1/merchant/query/${merchantId}/${rrr}/${verificationHash}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${verificationHash}`
      }
    });

    const remitaData = await response.json();

    // Remita status "00" or "01" indicates success
    if (remitaData.status === '00' || remitaData.status === '01') {
      // Update fee status in Supabase
      const { data: student, error } = await supabase
        .from('students')
        .update({ fee_status: 'PAID' })
        .eq('id', studentId)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully.',
        student
      });
    } else {
      return res.status(400).json({ error: remitaData.message || 'Payment verification failed on Remita.' });
    }
  } catch (err) {
    console.error("Payment Verification Error:", err);
    return res.status(500).json({ error: 'Server error during payment verification.' });
  }
};

module.exports = { initiatePayment, verifyPayment };