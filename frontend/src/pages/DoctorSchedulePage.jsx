import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Send, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import MonthCalendar from '../components/MonthCalendar';
import DayShiftModal from '../components/DayShiftModal';
import QuotaPanel from '../components/QuotaPanel';
import api from '../api/client';
import { getMonthString, formatMonthDisplay, SHIFT_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [schedules, setSchedules] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayShifts, setDayShifts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitWarnings, setSubmitWarnings] = useState([]);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, quotaRes] = await Promise.all([
        api.get(`/schedules?month=${monthStr}`),
        api.get(`/doctors/${user.id}/quotas?month=${monthStr}`),
      ]);
      setSchedules(schRes.data.schedules);
      setQuota(quotaRes.data.quota);
    } catch {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [monthStr, user.id]);

  useEffect(() => { load(); }, [load]);

  const changeMonth = (dir) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  };

  // Compute used counts
  const usedCounts = {};
  SHIFT_TYPES.forEach(s => { usedCounts[s.key] = 0; });
  schedules.forEach(s => { if (usedCounts[s.shift_type] !== undefined) usedCounts[s.shift_type]++; });

  const isSubmitted = schedules.some(s => s.status === 'submitted' || s.status === 'locked');

  const handleDayClick = (date, shifts) => {
    setSelectedDay(date);
    setDayShifts(shifts);
  };

  const handleAddShift = async (shiftType) => {
    try {
      const res = await api.post('/schedules', { date: selectedDay, shift_type: shiftType });
      const newShift = res.data.schedule;
      setDayShifts(prev => [...prev, newShift]);
      setSchedules(prev => [...prev, newShift]);
      // Update usedCounts
      toast.success(`${SHIFT_TYPES.find(s => s.key === shiftType)?.label} added!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add shift');
    }
  };

  const handleRemoveShift = async (id) => {
    try {
      await api.delete(`/schedules/${id}`);
      setDayShifts(prev => prev.filter(s => s.id !== id));
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success('Shift removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    }
  };

  const handleSubmitClick = () => {
    // Compute warnings
    const warns = SHIFT_TYPES.filter(s => (quota?.[s.key] || 0) > 0 && (usedCounts[s.key] || 0) < (quota?.[s.key] || 0));
    setSubmitWarnings(warns);
    setShowSubmitConfirm(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/schedules/submit', { month: monthStr });
      toast.success('Schedule submitted successfully! 🎉');
      setShowSubmitConfirm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Recompute day shifts when schedules change
  const refreshDayShifts = (date) => {
    setDayShifts(schedules.filter(s => s.date === date));
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>My Schedule</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                Click any day to add or remove shifts · {schedules.length} shifts planned
              </p>
            </div>
            {!isSubmitted ? (
              <button
                className="btn btn-primary"
                onClick={handleSubmitClick}
                disabled={schedules.length === 0}
              >
                <Send size={15} /> Submit Schedule
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 8 }}>
                <Lock size={15} style={{ color: '#34d399' }} />
                <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>Schedule Submitted</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
            {/* Calendar */}
            <div>
              {/* Month nav */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
                <span style={{ fontWeight: 700, fontSize: 17, minWidth: 160, textAlign: 'center' }}>
                  {formatMonthDisplay(monthStr)}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(1)}><ChevronRight size={16} /></button>
              </div>

              {isSubmitted && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                  padding: '10px 14px',
                  background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)',
                  borderRadius: 8,
                }}>
                  <CheckCircle size={15} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: 13, color: '#34d399' }}>
                    Schedule locked after submission. Contact admin for changes.
                  </span>
                </div>
              )}

              <div className="card">
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                    {[...Array(35)].map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 80, borderRadius: 6 }} />
                    ))}
                  </div>
                ) : (
                  <MonthCalendar
                    year={year}
                    month={month}
                    schedules={schedules}
                    onDayClick={handleDayClick}
                    selectedDate={selectedDay}
                    isAdmin={false}
                    isLocked={isSubmitted}
                  />
                )}
              </div>
            </div>

            {/* Quota sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ position: 'sticky', top: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📊 Quota Progress</h3>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 46, borderRadius: 6 }} />)}
                  </div>
                ) : quota ? (
                  <QuotaPanel quota={quota} usedCounts={usedCounts} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-text-muted)' }}>
                    <AlertTriangle size={20} style={{ color: '#fbbf24', marginBottom: 8 }} />
                    <p style={{ fontSize: 13 }}>No quota set for {formatMonthDisplay(monthStr)}</p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>Contact admin to set your quota.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Day Shift Modal */}
      {selectedDay && (
        <DayShiftModal
          date={selectedDay}
          shifts={dayShifts}
          quota={quota}
          usedCounts={usedCounts}
          onAdd={handleAddShift}
          onRemove={handleRemoveShift}
          onClose={() => setSelectedDay(null)}
          isAdmin={false}
          isLocked={isSubmitted}
        />
      )}

      {/* Submit Confirm Modal */}
      {showSubmitConfirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSubmitConfirm(false)}>
          <div className="modal">
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Submit Schedule?</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 6 }}>
                {formatMonthDisplay(monthStr)} · {schedules.length} shifts
              </p>
            </div>

            {submitWarnings.length > 0 && (
              <div style={{
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                borderRadius: 10, padding: 14, marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <AlertTriangle size={14} style={{ color: '#fbbf24' }} />
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#fbbf24' }}>Quota not fully completed:</span>
                </div>
                {submitWarnings.map(s => (
                  <div key={s.key} style={{ fontSize: 12, color: '#fbbf24', marginTop: 4 }}>
                    • {s.emoji} {s.label}: {usedCounts[s.key]}/{quota?.[s.key]} filled
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  You can still submit. Once submitted, your schedule will be locked.
                </p>
              </div>
            )}

            <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#34d399' }}>
                ⚠️ After submission, your schedule will be <strong>locked</strong> and you'll need admin approval to make changes.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowSubmitConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit} disabled={submitting}>
                <Send size={14} /> {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile responsiveness fix */}
      <style>{`
        @media (max-width: 900px) {
          .main-content > div > div[style*="grid-template-columns: 1fr 280px"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .main-content { padding-top: 72px !important; }
        }
      `}</style>
    </div>
  );
}
