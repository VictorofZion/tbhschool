require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

// Root-level files use ./routes (single dot)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', system: 'Tetotim Blessed Hope School API' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server executing on port ${PORT}`);
});

module.exports = app;