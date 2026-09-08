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