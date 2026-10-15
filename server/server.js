const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Discussify API Server',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  const connectDB = require('./config/db');
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Discussify server listening on port ${PORT}`);
    });
  }).catch((err) => {
    console.warn(`Server starting without database connection: ${err.message}`);
    app.listen(PORT, () => {
      console.log(`Discussify server listening on port ${PORT} (DB offline)`);
    });
  });
}

module.exports = app;
