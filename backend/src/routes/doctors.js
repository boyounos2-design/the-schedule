const express = require('express');
const { admin, getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/doctors
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('users').where('role', '==', 'doctor').orderBy('name').get();
    const doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ doctors });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// POST /api/doctors
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, username, password, specialty } = req.body;
    if (!name || !username || !password) return res.status(400).json({ error: 'Name, username, and password are required' });
    
    const db = getDb();
    const email = `${username.toLowerCase().trim()}@hospital.com`; // Dummy email for Firebase Auth

    // 1. Create in Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
    } catch (authErr) {
      if (authErr.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Username already in use' });
      }
      throw authErr;
    }

    // 2. Create in Firestore
    const doctorData = {
      name,
      username: username.toLowerCase().trim(),
      role: 'doctor',
      specialty: specialty || null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(userRecord.uid).set(doctorData);
    
    res.status(201).json({ doctor: { id: userRecord.uid, ...doctorData } });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// PUT /api/doctors/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, username, specialty, password } = req.body;
    const db = getDb();
    const docRef = db.collection('users').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const updates = { 
      name: name || doc.data().name, 
      username: username || doc.data().username, 
      specialty: specialty !== undefined ? specialty : doc.data().specialty 
    };

    // Update Firebase Auth if needed
    const authUpdates = { displayName: updates.name };
    if (password) authUpdates.password = password;
    await admin.auth().updateUser(req.params.id, authUpdates);

    await docRef.update(updates);
    const updated = await docRef.get();
    res.json({ doctor: { id: updated.id, ...updated.data() } });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection('users').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().role !== 'doctor') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Delete from Auth and Firestore
    await admin.auth().deleteUser(req.params.id);
    await docRef.delete();
    
    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// GET /api/doctors/:id/quotas?month=YYYY-MM
router.get('/:id/quotas', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month parameter required (YYYY-MM)' });
    const targetId = req.params.id;
    
    if (req.user.role === 'doctor' && String(req.user.id) !== String(targetId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const db = getDb();
    const quotaId = `${targetId}_${month}`;
    const quotaDoc = await db.collection('quotas').doc(quotaId).get();
    
    if (!quotaDoc.exists) {
      return res.json({ quota: { user_id: targetId, month, morning_er: 0, evening_er: 0, morning_dept: 0, evening_dept: 0, surgeries: 0, clinics: 0 } });
    }
    
    res.json({ quota: { id: quotaDoc.id, ...quotaDoc.data() } });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// PUT /api/doctors/:id/quotas
router.put('/:id/quotas', requireAdmin, async (req, res) => {
  try {
    const { month, morning_er, evening_er, morning_dept, evening_dept, surgeries, clinics } = req.body;
    if (!month) return res.status(400).json({ error: 'month required' });
    
    const db = getDb();
    const quotaId = `${req.params.id}_${month}`;
    const data = {
      user_id: req.params.id, 
      month,
      morning_er: Number(morning_er) || 0, 
      evening_er: Number(evening_er) || 0,
      morning_dept: Number(morning_dept) || 0, 
      evening_dept: Number(evening_dept) || 0, 
      surgeries: Number(surgeries) || 0, 
      clinics: Number(clinics) || 0,
    };
    
    await db.collection('quotas').doc(quotaId).set(data);
    const updated = await db.collection('quotas').doc(quotaId).get();
    
    res.json({ quota: { id: updated.id, ...updated.data() } });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;

module.exports = router;
