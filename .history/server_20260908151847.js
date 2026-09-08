const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file setup
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// Primary Static HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicPath, 'admin-dashboard.html')));
app.get('/teacher', (req, res) => res.sendFile(path.join(publicPath, 'teacher-dashboard.html')));
app.get('/student', (req, res) => res.sendFile(path.join(publicPath, 'student-dashboard.html')));

// Import Routes using relative path to root folder
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const examRoutes = require('../routes/examRoutes');
const materialRoutes = require('../routes/materialRoutes');
const feeRoutes = require('../routes/feeRoutes');
const paymentRoutes = require('../routes/paymentRoutes');

// Mount API Endpoints (handles both /api/auth and /auth routes)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/exams', examRoutes);
app.use('/exams', examRoutes);

app.use('/api/materials', materialRoutes);
app.use('/materials', materialRoutes);

app.use('/api/fees', feeRoutes);
app.use('/fees', feeRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', system: 'Tetotim Blessed Hope School API' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;