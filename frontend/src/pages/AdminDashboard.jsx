import { useState, useEffect } from 'react';
import { Users, Calendar, CheckCircle, Clock, Download, TrendingUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ShiftBadge from '../components/ShiftBadge';
import api from '../api/client';
import { getMonthString, formatMonthDisplay, SHIFT_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [month, setMonth] = useState(getMonthString());
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [docRes, schRes] = await Promise.all([
          api.get('/doctors'),
          api.get(`/schedules?month=${month}`),
        ]);
        setDoctors(docRes.data.doctors);
        setSchedules(schRes.data.schedules);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, [month]);

  const shiftCounts = {};
  SHIFT_TYPES.forEach(s => { shiftCounts[s.key] = 0; });
  schedules.forEach(s => {
    if (shiftCounts[s.shift_type] !== undefined) shiftCounts[s.shift_type]++;
  });

  const submittedDoctors = new Set(
    schedules.filter(s => s.status === 'submitted' || s.status === 'locked').map(s => s.user_id)
  ).size;

  const handleExportExcel = () => {
    window.open(`/api/export/excel?month=${month}&token=${localStorage.getItem('token')}`, '_blank');
  };
  const handleExportAttendance = () => {
    window.open(`/api/export/attendance?month=${month}&token=${localStorage.getItem('token')}`, '_blank');
  };

  // Month nav
  const changeMonth = (dir) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Overview of {formatMonthDisplay(month)} schedules and staff
            </p>
          </div>

          {/* Month Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(-1)}>←</button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{formatMonthDisplay(month)}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(1)}>→</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}>
              <Download size={14} /> Excel
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportAttendance}>
              <Download size={14} /> Attendance PDF
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard
              icon={<Users size={22} />}
              title="Total Doctors"
              value={doctors.length}
              sub="Active staff"
              color="#14b8a6"
            />
            <StatCard
              icon={<CheckCircle size={22} />}
              title="Submitted"
              value={submittedDoctors}
              sub={`of ${doctors.length} doctors`}
              color="#34d399"
            />
            <StatCard
              icon={<Calendar size={22} />}
              title="Total Shifts"
              value={schedules.length}
              sub="This month"
              color="#818cf8"
            />
            <StatCard
              icon={<Clock size={22} />}
              title="Pending"
              value={doctors.length - submittedDoctors}
              sub="Not yet submitted"
              color="#fbbf24"
            />
          </div>

          {/* Shift type breakdown */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              <TrendingUp size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--color-primary)' }} />
              Shift Distribution — {formatMonthDisplay(month)}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {SHIFT_TYPES.map(shift => (
                <div key={shift.key} style={{
                  background: 'var(--color-surface-2)',
                  borderRadius: 10,
                  padding: 14,
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{shift.emoji}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: shift.color }}>
                    {shiftCounts[shift.key]}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{shift.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctors overview table */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Doctor Status Overview</h3>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 6 }} />)}
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Shifts</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(doc => {
                      const docSchedules = schedules.filter(s => s.user_id === doc.id || s.doctor_name === doc.name);
                      const status = docSchedules.some(s => s.status === 'submitted' || s.status === 'locked')
                        ? 'submitted' : docSchedules.length > 0 ? 'draft' : 'pending';
                      return (
                        <tr key={doc.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0,
                              }}>
                                {doc.name.charAt(0)}
                              </div>
                              <span style={{ fontWeight: 500 }}>{doc.name}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{doc.specialty || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {docSchedules.length === 0
                                ? <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>No shifts yet</span>
                                : docSchedules.slice(0, 3).map(s => (
                                    <ShiftBadge key={s.id} shiftKey={s.shift_type} size="xs" showLabel={false} />
                                  ))
                              }
                              {docSchedules.length > 3 && (
                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>+{docSchedules.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge status-${status}`} style={{ borderRadius: 6 }}>
                              {status === 'submitted' ? '✓ Submitted' : status === 'draft' ? '✏ In Progress' : '○ Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, sub, color }) {
  return (
    <div className="stat-card" style={{ '--accent': color }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: color, borderRadius: '12px 12px 0 0',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {title}
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</p>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
