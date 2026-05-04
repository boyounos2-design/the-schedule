require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { onRequest } = require('firebase-functions/v2/https');
const { initDb } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173',
    'https://the-schedule-app.web.app',
    'https://the-schedule-app.firebaseapp.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// Initialize database
initDb();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/export', require('./routes/export'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'firebase' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🏥 Hospital Scheduler API running on http://localhost:${PORT}`);
  });
}

// Export the Express app as a Firebase Cloud Function
exports.api = onRequest({
  memory: '256MiB',
  timeoutSeconds: 30,
}, app);

// Support for Vercel
module.exports = app;
