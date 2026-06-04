import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './BookingDatePicker.css';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

const monthFormatter = new Intl.DateTimeFormat('en', {
  month: 'long',
  year: 'numeric',
});

const displayFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
    ? date
    : null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function buildCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { day: number; inMonth: boolean }[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: 0, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, inMonth: false });
  }
  return cells;
}

interface BookingDatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
}

export default function BookingDatePicker({
  value,
  onChange,
  required,
}: BookingDatePickerProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);
  const selected = useMemo(() => (value ? parseIso(value) : null), [value]);

  const initialView = selected ?? today;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  }, [selected]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const cells = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthLabel = monthFormatter.format(new Date(viewYear, viewMonth, 1));
  const minView = { year: today.getFullYear(), month: today.getMonth() };
  const canPrev =
    viewYear > minView.year ||
    (viewYear === minView.year && viewMonth > minView.month);

  const selectDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    if (date < today) return;
    onChange(toIso(date));
    setOpen(false);
  };

  const goToday = () => {
    onChange(toIso(today));
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setOpen(false);
  };

  const displayText = selected ? displayFormatter.format(selected) : '';

  return (
    <div className="booking-date" ref={rootRef}>
      <span className="booking-field__label" id={`${listId}-label`}>
        Event date {required ? '*' : ''}
      </span>

      <input
        type="hidden"
        name="eventDate"
        value={value}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
      />

      <button
        type="button"
        className={`booking-date__trigger${open ? ' booking-date__trigger--open' : ''}${!displayText ? ' booking-date__trigger--empty' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${listId}-label`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{displayText || 'Select date'}</span>
        <svg
          className="booking-date__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {open && (
        <div
          className="booking-date__popover"
          role="dialog"
          aria-label="Choose event date"
        >
          <div className="booking-date__header">
            <p className="booking-date__month">{monthLabel}</p>
            <div className="booking-date__nav">
              <button
                type="button"
                className="booking-date__nav-btn"
                aria-label="Previous month"
                disabled={!canPrev}
                onClick={() => {
                  const next = addMonths(viewYear, viewMonth, -1);
                  setViewYear(next.year);
                  setViewMonth(next.month);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="booking-date__nav-btn"
                aria-label="Next month"
                onClick={() => {
                  const next = addMonths(viewYear, viewMonth, 1);
                  setViewYear(next.year);
                  setViewMonth(next.month);
                }}
              >
                ›
              </button>
            </div>
          </div>

          <div className="booking-date__weekdays">
            {WEEKDAYS.map((d) => (
              <span key={d} className="booking-date__weekday">
                {d}
              </span>
            ))}
          </div>

          <div className="booking-date__grid">
            {cells.map((cell, i) => {
              if (!cell.inMonth) {
                return (
                  <span
                    key={`e-${i}`}
                    className="booking-date__day booking-date__day--muted"
                    aria-hidden="true"
                  />
                );
              }

              const date = new Date(viewYear, viewMonth, cell.day);
              const isPast = date < today;
              const isToday = date.getTime() === today.getTime();
              const isSelected =
                selected?.getTime() === date.getTime();

              return (
                <button
                  key={`d-${cell.day}`}
                  type="button"
                  className={[
                    'booking-date__day',
                    isToday ? 'booking-date__day--today' : '',
                    isSelected ? 'booking-date__day--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={isPast}
                  aria-label={displayFormatter.format(date)}
                  aria-pressed={isSelected}
                  onClick={() => selectDay(cell.day)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="booking-date__footer">
            <button
              type="button"
              className="booking-date__today-btn"
              onClick={goToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
