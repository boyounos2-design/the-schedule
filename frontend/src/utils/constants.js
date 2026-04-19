export const SHIFT_TYPES = [
  { key: 'morning_er', label: 'Morning ER', short: 'M-ER', emoji: '🌅', color: '#f59e0b', hours: 12 },
  { key: 'evening_er', label: 'Evening ER', short: 'E-ER', emoji: '🌆', color: '#f97316', hours: 12 },
  { key: 'morning_dept', label: 'Morning Dept', short: 'M-Dept', emoji: '🏥', color: '#0ea5e9', hours: 12 },
  { key: 'evening_dept', label: 'Evening Dept', short: 'E-Dept', emoji: '🌙', color: '#2563eb', hours: 12 },
  { key: 'surgeries', label: 'Surgery', short: 'Surg', emoji: '🔬', color: '#8b5cf6', hours: 12 },
  { key: 'clinics', label: 'Clinic', short: 'Clin', emoji: '💊', color: '#10b981', hours: 7 },
];

export const SHIFT_MAP = Object.fromEntries(SHIFT_TYPES.map(s => [s.key, s]));

export function getMonthString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthDisplay(monthStr) {
  const [y, m] = monthStr.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getDaysInMonth(year, month) {
  // month: 1-indexed
  return new Date(year, month, 0).getDate();
}

export function getCalendarDays(year, month) {
  // month: 1-indexed
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1) || getDaysInMonth(year - 1, 12);

  const days = [];

  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, current: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`, current: true });
  }

  // Next month padding (fill to complete rows)
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, current: false });
    }
  }

  return days;
}

export function toLocalDateString(dateStr) {
  // Format YYYY-MM-DD -> Apr 19, 2026
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function todayString() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}
