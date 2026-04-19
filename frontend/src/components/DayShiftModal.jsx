import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { SHIFT_TYPES, SHIFT_MAP, toLocalDateString } from '../utils/constants';
import ShiftBadge from './ShiftBadge';

export default function DayShiftModal({
  date, shifts = [], quota, usedCounts, onAdd, onRemove, onClose, isAdmin = false, isLocked = false
}) {
  const displayDate = toLocalDateString(date);
  const dayShiftKeys = shifts.map(s => s.shift_type);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{displayDate}</h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {isLocked && !isAdmin ? '🔒 Locked — submitted schedule' : 'Select your shifts for this day'}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Current shifts on this day */}
        {shifts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="label">Assigned Shifts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shifts.map((s) => (
                <div key={s.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--color-surface-2)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShiftBadge shiftKey={s.shift_type} size="sm" />
                    {s.doctor_name && (
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>— {s.doctor_name}</span>
                    )}
                  </div>
                  {(!isLocked || isAdmin) && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onRemove(s.id)}
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new shift */}
        {(!isLocked || isAdmin) && (
          <div>
            <div className="label" style={{ marginBottom: 10 }}>Add Shift</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SHIFT_TYPES.map((shift) => {
                const alreadyAdded = dayShiftKeys.includes(shift.key);
                const total = quota?.[shift.key] || 0;
                const used = usedCounts?.[shift.key] || 0;
                const atLimit = used >= total && total > 0;
                const disabled = alreadyAdded || (atLimit && !isAdmin);

                return (
                  <button
                    key={shift.key}
                    className="btn btn-secondary"
                    onClick={() => !disabled && onAdd(shift.key)}
                    disabled={disabled}
                    style={{
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      opacity: disabled ? 0.45 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{shift.emoji}</span>
                      <span style={{ fontWeight: 500 }}>{shift.label}</span>
                      {alreadyAdded && (
                        <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>✓ Added</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {total > 0 && (
                        <span style={{
                          fontSize: 11,
                          color: atLimit ? '#f87171' : 'var(--color-text-muted)',
                          fontWeight: 600,
                        }}>
                          {used}/{total}
                        </span>
                      )}
                      {!alreadyAdded && !atLimit && (
                        <Plus size={14} style={{ color: 'var(--color-primary)' }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Warning if no quota */}
        {!quota && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 16,
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: 8, padding: '10px 14px',
          }}>
            <AlertCircle size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#fbbf24' }}>No quota set for this month. Contact admin.</span>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
