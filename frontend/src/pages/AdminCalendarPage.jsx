import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MonthCalendar from '../components/MonthCalendar';
import DayShiftModal from '../components/DayShiftModal';
import ShiftBadge from '../components/ShiftBadge';
import api from '../api/client';
import { getMonthString, formatMonthDisplay, SHIFT_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';

export default function AdminCalendarPage() {
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
  });
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayShifts, setDayShifts] = useState([]);

  const [y, m] = month.split('-').map(Number);

  const load = async () => {
    setLoading(true);
    try {
      const [schRes, docRes] = await Promise.all([
        api.get(`/schedules?month=${month}`),
        api.get('/doctors'),
      ]);
      setSchedules(schRes.data.schedules);
      setDoctors(docRes.data.doctors);
    } catch (err) {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const changeMonth = (dir) => {
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };

  // Filtered schedules for calendar display
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (filterDoctor && String(s.user_id) !== filterDoctor) return false;
      if (filterShift && s.shift_type !== filterShift) return false;
      return true;
    });
  }, [schedules, filterDoctor, filterShift]);

  const handleDayClick = (date, shifts) => {
    setSelectedDay(date);
    setDayShifts(shifts);
  };

  const handleAdminRemove = async (id) => {
    try {
      await api.delete(`/schedules/${id}`);
      toast.success('Shift removed');
      setDayShifts(prev => prev.filter(s => s.id !== id));
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    }
  };

  const handleUnlock = async (userId) => {
    try {
      await api.post('/schedules/unlock', { doctorId: userId, month });
      toast.success('Schedule unlocked');
      load();
    } catch (err) {
      toast.error('Failed to unlock');
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Master Calendar</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>All doctors' schedules in one view</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => window.open(`/api/export/excel?month=${month}&token=${localStorage.getItem('token')}`, '_blank')}>
                <Download size={14} /> Excel
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => window.open(`/api/export/attendance?month=${month}&token=${localStorage.getItem('token')}`, '_blank')}>
                <Download size={14} /> Attendance PDF
              </button>
            </div>
          </div>

          {/* Month Nav + Filters */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(-1)}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 700, fontSize: 16, minWidth: 140, textAlign: 'center' }}>
                {formatMonthDisplay(month)}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(1)}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                <Filter size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <select
                  className="input select"
                  style={{ paddingLeft: 30, fontSize: 13 }}
                  value={filterDoctor}
                  onChange={e => setFilterDoctor(e.target.value)}
                >
                  <option value="">All Doctors</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <select
                className="input select"
                style={{ flex: 1, minWidth: 150, fontSize: 13 }}
                value={filterShift}
                onChange={e => setFilterShift(e.target.value)}
              >
                <option value="">All Shifts</option>
                {SHIFT_TYPES.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Calendar */}
          <div className="card" style={{ marginBottom: 24 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {[...Array(35)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 80, borderRadius: 6 }} />
                ))}
              </div>
            ) : (
              <MonthCalendar
                year={y} month={m}
                schedules={filteredSchedules}
                onDayClick={handleDayClick}
                selectedDate={selectedDay}
                isAdmin={true}
              />
            )}
          </div>

          {/* Unlock panel */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🔒 Unlock Submitted Schedules</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Unlock a doctor's submitted schedule to allow edits.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {doctors.map(doc => {
                const docSchedules = schedules.filter(s => s.user_id === doc.id || s.doctor_name === doc.name);
                const isSubmitted = docSchedules.some(s => s.status === 'submitted' || s.status === 'locked');
                return (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--color-surface-2)', borderRadius: 8, padding: '10px 14px',
                    border: '1px solid var(--color-border)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {docSchedules.length} shifts · {isSubmitted ? '🔒 Locked' : '✏ Draft'}
                      </div>
                    </div>
                    {isSubmitted && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleUnlock(doc.id)}
                      >
                        🔓 Unlock
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Admin Day Modal */}
      {selectedDay && (
        <DayShiftModal
          date={selectedDay}
          shifts={dayShifts}
          onRemove={handleAdminRemove}
          onAdd={() => {}}
          onClose={() => setSelectedDay(null)}
          isAdmin={true}
          isLocked={false}
        />
      )}
    </div>
  );
}
