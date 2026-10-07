import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : today;
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  // We want Monday = 0, ..., Sunday = 6
  let firstDayIndex = new Date(year, month, 1).getDay() - 1;
  if (firstDayIndex < 0) firstDayIndex = 6;

  const isCurrentMonthOrFuture = () => {
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return currentMonth > startOfCurrentMonth;
  };

  const handlePrevMonth = () => {
    if (!isCurrentMonthOrFuture()) return;
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const formatDateString = (d: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    return `${year}-${m}-${dayStr}`;
  };

  const isPast = (d: number): boolean => {
    const dateToCheck = new Date(year, month, d);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  const isSelected = (d: number): boolean => {
    return formatDateString(d) === selectedDate;
  };

  const isToday = (d: number): boolean => {
    return (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Quick shortcuts
  const selectToday = () => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setCurrentMonth(new Date(y, today.getMonth(), 1));
    onSelectDate(`${y}-${m}-${d}`);
  };

  const selectTomorrow = () => {
    const tmrw = new Date(today);
    tmrw.setDate(today.getDate() + 1);
    const y = tmrw.getFullYear();
    const m = String(tmrw.getMonth() + 1).padStart(2, '0');
    const d = String(tmrw.getDate()).padStart(2, '0');
    setCurrentMonth(new Date(y, tmrw.getMonth(), 1));
    onSelectDate(`${y}-${m}-${d}`);
  };

  const selectNextWeek = () => {
    const nextWk = new Date(today);
    nextWk.setDate(today.getDate() + 7);
    const y = nextWk.getFullYear();
    const m = String(nextWk.getMonth() + 1).padStart(2, '0');
    const d = String(nextWk.getDate()).padStart(2, '0');
    setCurrentMonth(new Date(y, nextWk.getMonth(), 1));
    onSelectDate(`${y}-${m}-${d}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900 text-base">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={!isCurrentMonthOrFuture()}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-xs">
        <span className="text-slate-600 font-medium hidden sm:inline">Quick pick:</span>
        <button
          type="button"
          onClick={selectToday}
          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium cursor-pointer"
        >
          Today
        </button>
        <button
          type="button"
          onClick={selectTomorrow}
          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium cursor-pointer"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={selectNextWeek}
          className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium cursor-pointer"
        >
          In 7 days
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-xs font-semibold text-slate-600 py-1 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty padding cells for first day alignment */}
        {Array.from({ length: firstDayIndex }).map((_, index) => (
          <div key={`empty-${index}`} className="h-10 sm:h-11" />
        ))}

        {/* Days in month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const dayNum = index + 1;
          const past = isPast(dayNum);
          const selected = isSelected(dayNum);
          const currentDay = isToday(dayNum);
          const dateVal = formatDateString(dayNum);

          return (
            <button
              key={dayNum}
              type="button"
              disabled={past}
              onClick={() => onSelectDate(dateVal)}
              className={`h-10 sm:h-11 w-full rounded-lg text-sm font-medium transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                selected
                  ? 'bg-slate-900 text-white font-semibold shadow-xs ring-2 ring-slate-900 ring-offset-1'
                  : past
                  ? 'text-slate-400 cursor-not-allowed hover:bg-transparent'
                  : 'text-slate-800 hover:bg-slate-100 active:scale-95'
              }`}
            >
              <span>{dayNum}</span>
              {currentDay && !selected && (
                <span className="w-1 h-1 bg-blue-600 rounded-full absolute bottom-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Selected Date:</span>
          <span className="font-semibold text-slate-900">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
};
