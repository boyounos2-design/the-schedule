import { SHIFT_TYPES } from '../utils/constants';

export default function QuotaPanel({ quota, usedCounts }) {
  if (!quota) return null;

  return (
    <div className="quota-panel">
      {SHIFT_TYPES.map((shift) => {
        const total = quota[shift.key] || 0;
        const used = usedCounts?.[shift.key] || 0;
        const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
        const isOver = used > total;
        const isFull = used === total && total > 0;
        const isWarn = total > 0 && used < total;

        return (
          <div key={shift.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>{shift.emoji}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{shift.label}</span>
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: isOver ? '#ef4444' : isFull ? '#34d399' : shift.color,
              }}>
                {used} / {total}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${pct}%`,
                  background: isOver ? '#ef4444' : isFull ? '#34d399' : shift.color,
                }}
              />
            </div>
            {isOver && (
              <span style={{ fontSize: 10, color: '#f87171' }}>⚠ Over quota</span>
            )}
            {isWarn && pct < 50 && total > 0 && (
              <span style={{ fontSize: 10, color: '#fbbf24' }}>{total - used} remaining</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
