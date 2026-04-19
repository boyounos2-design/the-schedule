const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/doctors
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const doctors = await db('users').select('id', 'name', 'username', 'specialty', 'created_at').where({ role: 'doctor' }).orderBy('name');
    res.json({ doctors });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/doctors
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, username, password, specialty } = req.body;
    if (!name || !username || !password) return res.status(400).json({ error: 'Name, username, and password are required' });
    const db = getDb();
    const existing = await db('users').where({ username: username.toLowerCase().trim() }).first();
    if (existing) return res.status(409).json({ error: 'Username already in use' });
    const hash = bcrypt.hashSync(password, 10);
    const [id] = await db('users').insert({ name, username: username.toLowerCase().trim(), password_hash: hash, role: 'doctor', specialty: specialty || null });
    const doctor = await db('users').select('id', 'name', 'username', 'specialty').where({ id }).first();
    res.status(201).json({ doctor });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/doctors/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, username, specialty, password } = req.body;
    const db = getDb();
    const doc = await db('users').where({ id: req.params.id, role: 'doctor' }).first();
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    const updates = { name, username, specialty: specialty || null };
    if (password) updates.password_hash = bcrypt.hashSync(password, 10);
    await db('users').where({ id: req.params.id }).update(updates);
    const updated = await db('users').select('id', 'name', 'username', 'specialty').where({ id: req.params.id }).first();
    res.json({ doctor: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/doctors/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const doc = await db('users').where({ id: req.params.id, role: 'doctor' }).first();
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    await db('users').where({ id: req.params.id }).delete();
    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    let quota = await db('quotas').where({ user_id: targetId, month }).first();
    if (!quota) {
      quota = { user_id: targetId, month, morning_er: 0, evening_er: 0, morning_dept: 0, evening_dept: 0, surgeries: 0, clinics: 0 };
    }
    res.json({ quota });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/doctors/:id/quotas
router.put('/:id/quotas', requireAdmin, async (req, res) => {
  try {
    const { month, morning_er, evening_er, morning_dept, evening_dept, surgeries, clinics } = req.body;
    if (!month) return res.status(400).json({ error: 'month required' });
    const db = getDb();
    const existing = await db('quotas').where({ user_id: req.params.id, month }).first();
    const data = {
      user_id: req.params.id, month,
      morning_er: morning_er || 0, evening_er: evening_er || 0,
      morning_dept: morning_dept || 0, evening_dept: evening_dept || 0, surgeries: surgeries || 0, clinics: clinics || 0,
    };
    if (existing) {
      await db('quotas').where({ user_id: req.params.id, month }).update(data);
    } else {
      await db('quotas').insert(data);
    }
    const quota = await db('quotas').where({ user_id: req.params.id, month }).first();
    res.json({ quota });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
