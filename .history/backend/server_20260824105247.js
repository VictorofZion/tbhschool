const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware Configuration
app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/auth', authRoutes);

// Base Health Check
app.get('/', (req, res) => {
  res.send('TBHS Backend API is running smoothly.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server connected on http://localhost:${PORT}`);
});