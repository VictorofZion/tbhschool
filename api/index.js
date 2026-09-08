const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import routes using relative pathing to project root
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const examRoutes = require('../routes/examRoutes');
const materialRoutes = require('../routes/materialRoutes');
const feeRoutes = require('../routes/feeRoutes');
const paymentRoutes = require('../routes/paymentRoutes');

// Mount API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', system: 'Tetotim Blessed Hope School API' });
});

module.exports = app;