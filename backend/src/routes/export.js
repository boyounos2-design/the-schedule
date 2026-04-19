const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { getDb } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

const SHIFT_LABELS = {
  morning_er: 'Morning ER',
  evening_er: 'Evening ER',
  morning_dept: 'Morning Dept',
  evening_dept: 'Evening Dept',
  surgeries: 'Surgery',
  clinics: 'Clinic',
};

const SHIFT_COLORS = {
  morning_er: 'FFFBBF24',
  evening_er: 'FFFB923C',
  morning_dept: 'FF38BDF8',
  evening_dept: 'FF2563EB',
  surgeries: 'FFA78BFA',
  clinics: 'FF34D399',
};

// GET /api/export/excel?month=YYYY-MM
router.get('/excel', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required' });

    const db = getDb();
    const schedules = await db('schedules as s')
      .join('users as u', 's.user_id', 'u.id')
      .select('s.date', 'u.name as doctor_name', 'u.specialty', 's.shift_type', 's.status')
      .where('s.date', 'like', `${month}%`)
      .orderBy(['s.date', 'u.name', 's.shift_type']);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Hospital Scheduler';
    workbook.created = new Date();

    const combined = workbook.addWorksheet('All Schedules');
    combined.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Doctor', key: 'doctor', width: 28 },
      { header: 'Specialty', key: 'specialty', width: 24 },
      { header: 'Shift Type', key: 'shift', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    combined.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      cell.alignment = { horizontal: 'center' };
    });
    schedules.forEach((s, i) => {
      const row = combined.addRow({
        date: s.date, doctor: s.doctor_name, specialty: s.specialty || '—',
        shift: SHIFT_LABELS[s.shift_type] || s.shift_type, status: s.status,
      });
      if (i % 2 === 0) row.eachCell(cell => { cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF8FAFC' } }; });
      const shiftCell = row.getCell('shift');
      shiftCell.fill = { type:'pattern',pattern:'solid', fgColor:{ argb: SHIFT_COLORS[s.shift_type]||'FFFFFFFF' } };
      shiftCell.font = { bold: true };
    });

    // Per-doctor sheets
    const doctorMap = {};
    schedules.forEach(s => { (doctorMap[s.doctor_name] = doctorMap[s.doctor_name] || []).push(s); });
    Object.entries(doctorMap).forEach(([docName, entries]) => {
      const sheet = workbook.addWorksheet(docName.substring(0, 31));
      sheet.columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Shift Type', key: 'shift', width: 20 },
        { header: 'Status', key: 'status', width: 14 },
      ];
      sheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      });
      entries.forEach(s => {
        const row = sheet.addRow({ date: s.date, shift: SHIFT_LABELS[s.shift_type]||s.shift_type, status: s.status });
        row.getCell('shift').fill = { type:'pattern',pattern:'solid', fgColor:{ argb: SHIFT_COLORS[s.shift_type]||'FFFFFFFF' } };
        row.getCell('shift').font = { bold: true };
      });
    });

    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="schedule-${month}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/export/attendance?month=YYYY-MM
router.get('/attendance', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month required' });

    const db = getDb();
    const schedules = await db('schedules as s')
      .join('users as u', 's.user_id', 'u.id')
      .select('s.date', 'u.name as doctor_name', 'u.specialty', 's.shift_type')
      .where('s.date', 'like', `${month}%`)
      .orderBy(['s.date', 'u.name']);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`attachment; filename="attendance-${month}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text('Hospital Schedule — Attendance Sheet', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Month: ${month}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    const cols = { date: 40, doctor: 120, shift: 310, signature: 435 };
    const headerY = doc.y;
    doc.rect(40, headerY - 4, 515, 20).fill('#0F172A');
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    doc.text('Date', cols.date, headerY, { width: 75 });
    doc.text('Doctor', cols.doctor, headerY, { width: 185 });
    doc.text('Shift', cols.shift, headerY, { width: 120 });
    doc.text('Signature', cols.signature, headerY, { width: 120 });
    doc.fillColor('black').font('Helvetica').fontSize(9);
    doc.moveDown(0.8);

    schedules.forEach((s, i) => {
      if (doc.y > 750) { doc.addPage(); doc.moveDown(1); }
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY - 2, 515, 16).fill('#F8FAFC');
      doc.fillColor('black');
      doc.text(s.date, cols.date, rowY, { width: 75 });
      doc.text(s.doctor_name, cols.doctor, rowY, { width: 185 });
      doc.text(SHIFT_LABELS[s.shift_type]||s.shift_type, cols.shift, rowY, { width: 120 });
      doc.moveTo(cols.signature, rowY+12).lineTo(cols.signature+110, rowY+12).stroke();
      doc.moveDown(0.7);
    });

    doc.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;
