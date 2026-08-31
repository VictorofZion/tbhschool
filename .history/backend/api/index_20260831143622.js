require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Configure dynamic CORS permissions
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Import Controllers
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const academicController = require('./controllers/academicController');

// Mount API Routes
app.use('/api/auth', authController);
app.use('/api/admin', adminController);
app.use('/api/academic', academicController);

// Base Health Endpoint
app.get('/api', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'TBH Schools Vercel Backend Operational' });
});

// Export Express App for Vercel Serverless Functions
module.exports = app;