
const express = require('express');
const cors = require('cors');

const app = express();

// Whitelist permitted domain origins
const allowedOrigins = [
  'https://tbhschools.netlify.app',
  'http://localhost:5000',
  'http://127.0.0.1:5500',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or server-to-server calls)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// 1. Enable CORS middleware globally for all routes & preflight OPTIONS requests
app.use(cors(corsOptions));

// 2. Parse incoming JSON request bodies
app.use(express.json({ limit: '10mb' }));

// ... rest of your route mounts (e.g. app.use('/api/auth', authRoutes)) follow below

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const academicRoutes = require('./routes/academicRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const examRoutes = require('./routes/examRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
// Add import at the top of backend/server.js
const materialRoutes = require('./routes/materialRoutes');

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. Development & Production CORS Policy
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // In local development, allow all origins (including file:// and any local server port)
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, enforce origin checks
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Origin not allowed.'));
    }
  },
  credentials: true
}));

// 3. Express JSON Parser
app.use(express.json({ limit: '10mb' }));

// 4. Rate Limiter for Authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts
  message: { error: "Too many login attempts from this IP. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/materials', materialRoutes);
// Base Route
app.get('/', (req, res) => {
  res.status(200).send('TBHS Secure API Gateway is active.');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TBHS Server running on port ${PORT}`);
});