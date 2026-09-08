const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 1. API Routes (MUST come before static HTML routes)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// 2. Static File Serving
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// 3. Page Routes
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(publicPath, 'admin-dashboard.html')));
app.get('/teacher', (req, res) => res.sendFile(path.join(publicPath, 'teacher-dashboard.html')));
app.get('/student', (req, res) => res.sendFile(path.join(publicPath, 'student-dashboard.html')));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});


module.exports = app;