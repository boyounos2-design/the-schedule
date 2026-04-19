import { SHIFT_MAP } from '../utils/constants';

export default function ShiftBadge({ shiftKey, size = 'md', showLabel = true }) {
  const shift = SHIFT_MAP[shiftKey];
  if (!shift) return null;

  const sizeClass = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-[12px] px-2.5 py-1',
    lg: 'text-[13px] px-3 py-1.5',
  }[size] || 'text-[12px] px-2.5 py-1';

  return (
    <span className={`badge shift-${shiftKey} ${sizeClass}`} style={{ borderRadius: '6px' }}>
      <span>{shift.emoji}</span>
      {showLabel && <span style={{ marginLeft: 4 }}>{shift.label}</span>}
    </span>
  );
}
