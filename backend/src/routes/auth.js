const express = require('express');
const { admin, getDb } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
// DEPRECATED: Frontend should use Firebase Web SDK to login directly.
router.post('/login', async (req, res) => {
  res.status(410).json({ 
    error: 'Direct login endpoint is deprecated.', 
    message: 'Please use the Firebase Web SDK on the frontend to sign in.' 
  });
});

// GET /api/auth/setup
// TEMPORARY: Use this to seed the first admin user
router.get('/setup', async (req, res) => {
  try {
    const db = getDb();
    const email = 'admin@hospital.com';
    const password = 'admin123';
    
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: 'Hospital Admin',
        });
      } else { throw err; }
    }

    const adminData = {
      name: 'Hospital Admin',
      username: 'admin',
      role: 'admin',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(userRecord.uid).set(adminData);
    res.json({ message: 'Admin seeded successfully', email, password });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  // authenticateToken already populates req.user from Firestore
  res.json({ user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Firebase Admin can update password directly without knowing the current one (Admin privilege)
    // For user-self-service, Firebase Web SDK is usually preferred, but this works too.
    await admin.auth().updateUser(req.user.id, {
      password: newPassword
    });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
