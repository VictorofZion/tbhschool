const crypto = require('crypto');
const supabase = require('../config/db');

// 1. Initiate Payment: Generate SHA-512 Hash & Transaction Order ID
const initiatePayment = async (req, res) => {
  const { student_id, amount, payer_name, payer_email } = req.body;

  if (!student_id || !amount || !payer_email) {
    return res.status(400).json({ error: 'Student ID, amount, and email are required.' });
  }

  try {
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID;
    const apiKey = process.env.REMITA_API_KEY;
    const publicKey = process.env.REMITA_PUBLIC_KEY || merchantId;
    const orderId = `TBH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const rawString = `${merchantId}${serviceTypeId}${orderId}${amount}${apiKey}`;
    const apiHash = crypto.createHash('sha512').update(rawString).digest('hex');

    return res.status(200).json({
      success: true,
      paymentConfig: {
        merchantId,
        serviceTypeId,
        publicKey,
        orderId,
        amount,
        apiHash,
        payerName: payer_name,
        payerEmail: payer_email
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to initiate payment transaction.' });
  }
};
// 2. Verify Payment: Check Remita Status API & Update Supabase
const verifyPayment = async (req, res) => {
  const { rrr, studentId } = req.body;

  if (!studentId || !rrr) {
    return res.status(400).json({ error: 'Student ID and RRR are required.' });
  }

  try {
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const apiKey = process.env.REMITA_API_KEY;
    const baseUrl = process.env.REMITA_BASE_URL || 'https://remitademo.net';

    // Hash Formula for Verification: SHA512(rrr + apiKey + merchantId)
    const hashString = `${rrr}${apiKey}${merchantId}`;
    const verificationHash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Query Remita Verification API
    const response = await fetch(`${baseUrl}/payment/api/v1/merchant/query/${merchantId}/${rrr}/${verificationHash}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${verificationHash}`
      }
    });

    const remitaData = await response.json();

    // Status '00' or '01' indicates a successful payment on Remita
    if (remitaData.status === '00' || remitaData.status === '01') {
      const { data: student, error } = await supabase
        .from('students')
        .update({ fee_status: 'PAID' })
        .eq('id', studentId)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ success: true, message: 'Payment verified successfully.', student });
    } else {
      return res.status(400).json({ error: remitaData.message || 'Payment verification failed.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error during payment verification.' });
  }
};

module.exports = { initiatePayment, verifyPayment };