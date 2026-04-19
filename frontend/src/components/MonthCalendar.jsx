import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarDays, formatMonthDisplay, todayString, SHIFT_TYPES } from '../utils/constants';
import ShiftBadge from './ShiftBadge';

export default function MonthCalendar({
  year, month, schedules = [], onDayClick, selectedDate, isAdmin = false, isLocked = false
}) {
  const days = getCalendarDays(year, month);
  const today = todayString();

  // Group schedules by date
  const byDate = {};
  schedules.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = [];
    byDate[s.date].push(s);
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Week headers */}
      <div className="calendar-grid" style={{ gap: 4 }}>
        {weekDays.map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            padding: '4px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="calendar-grid">
        {days.map(({ date, current }) => {
          const dayShifts = byDate[date] || [];
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const locked = isLocked || dayShifts.some(s => s.status === 'submitted' || s.status === 'locked');

          return (
            <div
              key={date}
              className={`calendar-day ${!current ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${locked && !isAdmin ? 'locked' : ''}`}
              onClick={() => current && onDayClick && onDayClick(date, dayShifts)}
              title={locked && !isAdmin ? 'Schedule locked' : undefined}
            >
              <div className="day-number">
                {parseInt(date.split('-')[2], 10)}
                {isToday && (
                  <span style={{
                    marginLeft: 4,
                    fontSize: 9,
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 4,
                    padding: '1px 4px',
                    fontWeight: 700,
                  }}>TODAY</span>
                )}
              </div>

              {/* Shift indicators */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {dayShifts.slice(0, 4).map((s) => (
                  <span
                    key={s.id}
                    className={`shift-dot dot-${s.shift_type}`}
                    title={SHIFT_TYPES.find(t => t.key === s.shift_type)?.label}
                  />
                ))}
              </div>

              {/* Show shift badges on larger days */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                {dayShifts.slice(0, 2).map((s) => (
                  <ShiftBadge key={s.id} shiftKey={s.shift_type} size="xs" />
                ))}
                {dayShifts.length > 2 && (
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>+{dayShifts.length - 2} more</span>
                )}
              </div>

              {isAdmin && dayShifts.length > 0 && (
                <div style={{ position: 'absolute', top: 4, right: 4, opacity: 0.6 }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    {[...new Set(dayShifts.map(s => s.doctor_name?.split(' ')[1] || s.doctor_name))].slice(0,2).join(', ')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 8 }}>
        {SHIFT_TYPES.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className={`shift-dot dot-${s.key}`} />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
