const express = require('express');
const { admin, getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const VALID_SHIFTS = ['morning_er','evening_er','morning_dept','evening_dept','surgeries','clinics'];

// GET /api/schedules?month=YYYY-MM&doctorId=
router.get('/', async (req, res) => {
  try {
    const { month, doctorId } = req.query;
    if (!month) return res.status(400).json({ error: 'month parameter required (YYYY-MM)' });
    
    const db = getDb();
    const startDate = `${month}-01`;
    const endDate = `${month}-31`; // Firestore can handle string comparison for dates

    let query = db.collection('schedules')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate);

    if (req.user.role === 'admin') {
      if (doctorId) query = query.where('user_id', '==', doctorId);
    } else {
      query = query.where('user_id', '==', req.user.id);
    }

    const snapshot = await query.get();
    
    // Fetch user names for the schedules (joins aren't possible in Firestore, so we might need a small map)
    const userIds = [...new Set(snapshot.docs.map(doc => doc.data().user_id))];
    const userMap = {};
    if (userIds.length > 0) {
      const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
      usersSnapshot.forEach(u => { userMap[u.id] = u.data(); });
    }

    const schedules = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data, 
        doctor_name: userMap[data.user_id]?.name || 'Unknown',
        specialty: userMap[data.user_id]?.specialty || null
      };
    }).sort((a, b) => a.date.localeCompare(b.date) || a.doctor_name.localeCompare(b.doctor_name));

    res.json({ schedules });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// POST /api/schedules
router.post('/', async (req, res) => {
  try {
    const { date, shift_type, doctorId } = req.body;
    if (!date || !shift_type) return res.status(400).json({ error: 'date and shift_type are required' });
    if (!VALID_SHIFTS.includes(shift_type)) return res.status(400).json({ error: 'Invalid shift_type' });

    const db = getDb();
    const targetUserId = (req.user.role === 'admin' && doctorId) ? doctorId : req.user.id;
    const month = date.substring(0, 7);

    // 1. Check locked
    const snapshot = await db.collection('schedules')
      .where('user_id', '==', targetUserId)
      .where('date', '>=', `${month}-01`)
      .where('date', '<=', `${month}-31`)
      .where('status', 'in', ['submitted', 'locked'])
      .limit(1)
      .get();

    if (!snapshot.empty && req.user.role !== 'admin') {
      return res.status(409).json({ error: 'Schedule is locked after submission. Contact admin.' });
    }

    // 2. Check quota
    const quotaDoc = await db.collection('quotas').doc(`${targetUserId}_${month}`).get();
    if (!quotaDoc.exists) return res.status(409).json({ error: 'No quota set for this month. Ask admin to set your quota.' });
    const quota = quotaDoc.data();

    // 3. Count used
    const usedSnapshot = await db.collection('schedules')
      .where('user_id', '==', targetUserId)
      .where('shift_type', '==', shift_type)
      .where('date', '>=', `${month}-01`)
      .where('date', '<=', `${month}-31`)
      .get();

    if (usedSnapshot.size >= (quota[shift_type] || 0)) {
      return res.status(409).json({
        error: `Quota exceeded for ${shift_type.replace(/_/g,' ')}. Limit: ${quota[shift_type]}, Used: ${usedSnapshot.size}`
      });
    }

    // 4. Insert with unique ID
    const scheduleId = `${targetUserId}_${date}_${shift_type}`;
    const scheduleRef = db.collection('schedules').doc(scheduleId);
    
    // Check if exists
    const existing = await scheduleRef.get();
    if (existing.exists) {
      return res.status(409).json({ error: 'This shift is already assigned for this day' });
    }

    const newSchedule = {
      user_id: targetUserId,
      date,
      shift_type,
      status: 'draft',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await scheduleRef.set(newSchedule);
    res.status(201).json({ schedule: { id: scheduleId, ...newSchedule } });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const docRef = db.collection('schedules').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    const schedule = doc.data();

    if (req.user.role !== 'admin' && schedule.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (schedule.status !== 'draft' && req.user.role !== 'admin') {
      return res.status(409).json({ error: 'Cannot delete: schedule is locked' });
    }

    await docRef.delete();
    res.json({ message: 'Shift removed' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// POST /api/schedules/submit
router.post('/submit', async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'month required' });
    const db = getDb();
    const userId = req.user.id;

    // Check quotas vs filled
    const quotaDoc = await db.collection('quotas').doc(`${userId}_${month}`).get();
    const snapshot = await db.collection('schedules')
      .where('user_id', '==', userId)
      .where('date', '>=', `${month}-01`)
      .where('date', '<=', `${month}-31`)
      .get();

    const shiftMap = {};
    snapshot.docs.forEach(doc => {
      const st = doc.data().shift_type;
      shiftMap[st] = (shiftMap[st] || 0) + 1;
    });

    const warnings = [];
    if (quotaDoc.exists) {
      const quota = quotaDoc.data();
      VALID_SHIFTS.forEach(t => {
        const used = shiftMap[t] || 0;
        if (used < (quota[t] || 0)) {
          warnings.push(`${t.replace(/_/g,' ')}: ${used}/${quota[t]} filled`);
        }
      });
    }

    // Batch update drafts to submitted
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      if (doc.data().status === 'draft') {
        batch.update(doc.ref, { status: 'submitted' });
      }
    });
    
    await batch.commit();
    res.json({ message: 'Schedule submitted successfully', warnings });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// PUT /api/schedules/:id (admin override)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, date, shift_type } = req.body;
    const db = getDb();
    const docRef = db.collection('schedules').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });

    const updates = {};
    if (status) updates.status = status;
    if (date) updates.date = date;
    if (shift_type) updates.shift_type = shift_type;

    await docRef.update(updates);
    const updated = await docRef.get();
    res.json({ schedule: { id: updated.id, ...updated.data() } });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// POST /api/schedules/unlock (admin)
router.post('/unlock', requireAdmin, async (req, res) => {
  try {
    const { doctorId, month } = req.body;
    if (!doctorId || !month) return res.status(400).json({ error: 'doctorId and month required' });
    
    const db = getDb();
    const snapshot = await db.collection('schedules')
      .where('user_id', '==', doctorId)
      .where('date', '>=', `${month}-01`)
      .where('date', '<=', `${month}-31`)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'draft' });
    });
    
    await batch.commit();
    res.json({ message: 'Schedule unlocked' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;

module.exports = router;
