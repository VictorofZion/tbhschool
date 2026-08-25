const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send('TBHS Backend API is running smoothly.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server connected on http://localhost:${PORT}`);
});