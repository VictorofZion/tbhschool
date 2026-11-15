const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 1. Global Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Serve Static Files with Automatic .html Resolution (Clean URLs)
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath, { extensions: ['html', 'htm'] }));

// 3. Import API Route Handlers
const galleryRoutes = require('./routes/galleryRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const academicRoutes = require('./routes/academicRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const examRoutes = require('./routes/examRoutes');
const materialRoutes = require('./routes/materialRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');

// 4. Mount API Endpoints
app.use('/api/gallery', galleryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);

// 5. Explicit Clean-URL Page Routes
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(publicPath, 'gallery.html')));
app.get('/admin-dashboard', (req, res) => res.sendFile(path.join(publicPath, 'admin-dashboard.html')));
app.get('/teacher-dashboard', (req, res) => res.sendFile(path.join(publicPath, 'teacher-dashboard.html')));
app.get('/student-dashboard', (req, res) => res.sendFile(path.join(publicPath, 'student-dashboard.html')));

// 6. Start Server on Render / Local (Skip only on Vercel Serverless)
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;