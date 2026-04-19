import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import QuotaPanel from '../components/QuotaPanel';
import ShiftBadge from '../components/ShiftBadge';
import api from '../api/client';
import { getMonthString, formatMonthDisplay, SHIFT_TYPES } from '../utils/constants';
import { Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [month, setMonth] = useState(getMonthString());
  const [schedules, setSchedules] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [schRes, quotaRes] = await Promise.all([
        api.get(`/schedules?month=${month}`),
        api.get(`/doctors/${user.id}/quotas?month=${month}`),
      ]);
      setSchedules(schRes.data.schedules);
      setQuota(quotaRes.data.quota);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month]);

  const usedCounts = {};
  SHIFT_TYPES.forEach(s => { usedCounts[s.key] = 0; });
  schedules.forEach(s => { if (usedCounts[s.shift_type] !== undefined) usedCounts[s.shift_type]++; });

  const isSubmitted = schedules.some(s => s.status === 'submitted' || s.status === 'locked');
  const totalQuota = SHIFT_TYPES.reduce((sum, s) => sum + (quota?.[s.key] || 0), 0);
  const totalUsed = schedules.length;

  // Check quota warnings
  const warnings = SHIFT_TYPES.filter(s => {
    const total = quota?.[s.key] || 0;
    const used = usedCounts[s.key] || 0;
    return total > 0 && used < total;
  });

  const changeMonth = (dir) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // Group schedules by date for recent view
  const recent = [...schedules].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
              Good morning, <span className="gradient-text">{user?.name?.split(' ').slice(-1)[0] || 'Doctor'}</span> 👋
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {user?.specialty || 'Your scheduling overview'}
            </p>
          </div>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(-1)}>←</button>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{formatMonthDisplay(month)}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(1)}>→</button>
            {isSubmitted && (
              <span className="badge status-submitted" style={{ marginLeft: 8 }}>🔒 Submitted</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            {/* Left: Stats + Recent */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <MiniStat icon={<Calendar size={18} />} label="Total Shifts" value={totalUsed} color="#14b8a6" />
                <MiniStat icon={<CheckCircle size={18} />} label="Quota Target" value={totalQuota} color="#818cf8" />
                <MiniStat
                  icon={<AlertTriangle size={18} />}
                  label="Unfilled"
                  value={Math.max(0, totalQuota - totalUsed)}
                  color={totalQuota - totalUsed > 0 ? '#fbbf24' : '#34d399'}
                />
                <MiniStat
                  icon={<Clock size={18} />}
                  label="Status"
                  value={isSubmitted ? 'Locked' : 'Draft'}
                  color={isSubmitted ? '#34d399' : '#94a3b8'}
                  isText
                />
              </div>

              {/* Warnings */}
              {!isSubmitted && warnings.length > 0 && (
                <div style={{
                  background: 'rgba(251,191,36,0.07)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  borderRadius: 10, padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <AlertTriangle size={15} style={{ color: '#fbbf24' }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#fbbf24' }}>Unfilled Quota</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {warnings.map(s => (
                      <span key={s.key} style={{
                        background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                        borderRadius: 6, padding: '3px 8px', fontSize: 12, color: '#fbbf24',
                      }}>
                        {s.emoji} {s.label}: {usedCounts[s.key]}/{quota?.[s.key]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Shifts */}
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
                  📋 Your Schedule — {formatMonthDisplay(month)}
                </h3>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 6 }} />)}
                  </div>
                ) : recent.length === 0 ? (
                  <div style={{ textAlign: 'center', paddingTop: 30, paddingBottom: 30, color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                    <p style={{ fontSize: 14, fontWeight: 500 }}>No shifts scheduled yet</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Go to My Schedule to start filling in your shifts</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recent.map(s => (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'var(--color-surface-2)', borderRadius: 8, padding: '10px 14px',
                        border: '1px solid var(--color-border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, minWidth: 70 }}>
                            {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <ShiftBadge shiftKey={s.shift_type} size="sm" />
                        </div>
                        <span className={`badge status-${s.status}`} style={{ fontSize: 10 }}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                    {schedules.length > 8 && (
                      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        +{schedules.length - 8} more shifts. See My Schedule for full view.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quota Panel */}
            <div className="card" style={{ position: 'sticky', top: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📊 Monthly Quota</h3>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 46, borderRadius: 6 }} />)}
                </div>
              ) : quota ? (
                <QuotaPanel quota={quota} usedCounts={usedCounts} />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-muted)' }}>
                  <p style={{ fontSize: 13 }}>No quota set for this month.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Contact your admin.</p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: quota below on small screens */}
          <style>{`
            @media (max-width: 768px) {
              .dash-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      </main>
    </div>
  );
}

function MiniStat({ icon, label, value, color, isText }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color }}>
        {icon}
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: isText ? 16 : 26, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
