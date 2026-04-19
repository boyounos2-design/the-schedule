const express = require('express');
const { getDb } = require('../db/database');
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
    let query = db('schedules as s')
      .join('users as u', 's.user_id', 'u.id')
      .select('s.*', 'u.name as doctor_name', 'u.specialty')
      .whereRaw("strftime('%Y-%m', s.date) = ?", [month])
      .orderBy(['s.date', 'u.name', 's.shift_type']);

    if (req.user.role === 'admin') {
      if (doctorId) query = query.where('s.user_id', doctorId);
    } else {
      query = query.where('s.user_id', req.user.id);
    }
    const schedules = await query;
    res.json({ schedules });
  } catch (err) { res.status(500).json({ error: err.message }); }
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

    // Check locked
    const lockedCount = await db('schedules')
      .where({ user_id: targetUserId })
      .whereRaw("strftime('%Y-%m', date) = ?", [month])
      .whereIn('status', ['submitted','locked'])
      .count('id as cnt')
      .first();

    if (lockedCount.cnt > 0 && req.user.role !== 'admin') {
      return res.status(409).json({ error: 'Schedule is locked after submission. Contact admin.' });
    }

    // Check quota
    const quota = await db('quotas').where({ user_id: targetUserId, month }).first();
    if (!quota) return res.status(409).json({ error: 'No quota set for this month. Ask admin to set your quota.' });

    const usedRow = await db('schedules')
      .where({ user_id: targetUserId, shift_type })
      .whereRaw("strftime('%Y-%m', date) = ?", [month])
      .count('id as cnt').first();

    if (usedRow.cnt >= quota[shift_type]) {
      return res.status(409).json({
        error: `Quota exceeded for ${shift_type.replace(/_/g,' ')}. Limit: ${quota[shift_type]}, Used: ${usedRow.cnt}`
      });
    }

    try {
      const [id] = await db('schedules').insert({ user_id: targetUserId, date, shift_type, status: 'draft' });
      const schedule = await db('schedules').where({ id }).first();
      res.status(201).json({ schedule });
    } catch (err2) {
      if (err2.message && err2.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'This shift is already assigned for this day' });
      }
      throw err2;
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const schedule = await db('schedules').where({ id: req.params.id }).first();
    if (!schedule) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && schedule.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (schedule.status !== 'draft' && req.user.role !== 'admin') {
      return res.status(409).json({ error: 'Cannot delete: schedule is locked' });
    }
    await db('schedules').where({ id: req.params.id }).delete();
    res.json({ message: 'Shift removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/schedules/submit
router.post('/submit', async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'month required' });
    const db = getDb();
    const userId = req.user.id;

    const quota = await db('quotas').where({ user_id: userId, month }).first();
    const shiftsRaw = await db('schedules')
      .select('shift_type')
      .count('id as cnt')
      .where({ user_id: userId })
      .whereRaw("strftime('%Y-%m', date) = ?", [month])
      .groupBy('shift_type');

    const shiftMap = {};
    shiftsRaw.forEach(s => { shiftMap[s.shift_type] = s.cnt; });

    const warnings = [];
    if (quota) {
      VALID_SHIFTS.forEach(t => {
        const used = shiftMap[t] || 0;
        if (used < (quota[t] || 0)) {
          warnings.push(`${t.replace(/_/g,' ')}: ${used}/${quota[t]} filled`);
        }
      });
    }

    await db('schedules')
      .where({ user_id: userId, status: 'draft' })
      .whereRaw("strftime('%Y-%m', date) = ?", [month])
      .update({ status: 'submitted' });

    res.json({ message: 'Schedule submitted successfully', warnings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/schedules/:id (admin override)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, date, shift_type } = req.body;
    const db = getDb();
    const schedule = await db('schedules').where({ id: req.params.id }).first();
    if (!schedule) return res.status(404).json({ error: 'Not found' });
    await db('schedules').where({ id: req.params.id }).update({
      status: status || schedule.status,
      date: date || schedule.date,
      shift_type: shift_type || schedule.shift_type,
    });
    const updated = await db('schedules').where({ id: req.params.id }).first();
    res.json({ schedule: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/schedules/unlock (admin)
router.post('/unlock', requireAdmin, async (req, res) => {
  try {
    const { doctorId, month } = req.body;
    if (!doctorId || !month) return res.status(400).json({ error: 'doctorId and month required' });
    const db = getDb();
    await db('schedules')
      .where({ user_id: doctorId })
      .whereRaw("strftime('%Y-%m', date) = ?", [month])
      .update({ status: 'draft' });
    res.json({ message: 'Schedule unlocked' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
