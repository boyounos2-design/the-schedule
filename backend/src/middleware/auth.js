const { admin, getDb } = require('../db/database');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify the Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const db = getDb();
    
    // In Firebase, we can store user data in Firestore under collection 'users'
    // using the Firebase Auth UID as the document ID.
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User profile not found in Firestore' });
    }
    
    const user = { id: userDoc.id, ...userDoc.data() };
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Error:', err);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
