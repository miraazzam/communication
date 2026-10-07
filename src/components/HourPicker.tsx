import React, { useState } from 'react';
import { Clock, Sun, Moon, Sunrise, Sunset, Plus, Minus } from 'lucide-react';

interface HourPickerProps {
  selectedHour: string;
  onSelectHour: (hour: string) => void;
  hoursCount: number;
  onChangeHoursCount: (count: number) => void;
}

export interface HourOption {
  time: string;
  hour24: number;
  period: 'night' | 'morning' | 'afternoon' | 'evening';
  label: string;
}

// Generate all 24 hours of day and night
export const ALL_24_HOURS: HourOption[] = [
  // Night / Early Morning (12am - 5am)
  { time: '12:00 AM', hour24: 0, period: 'night', label: 'Midnight' },
  { time: '01:00 AM', hour24: 1, period: 'night', label: 'Late Night' },
  { time: '02:00 AM', hour24: 2, period: 'night', label: 'Late Night' },
  { time: '03:00 AM', hour24: 3, period: 'night', label: 'Late Night' },
  { time: '04:00 AM', hour24: 4, period: 'night', label: 'Early Dawn' },
  { time: '05:00 AM', hour24: 5, period: 'night', label: 'Early Dawn' },

  // Morning (6am - 11am)
  { time: '06:00 AM', hour24: 6, period: 'morning', label: 'Early Morning' },
  { time: '07:00 AM', hour24: 7, period: 'morning', label: 'Morning' },
  { time: '08:00 AM', hour24: 8, period: 'morning', label: 'Morning' },
  { time: '09:00 AM', hour24: 9, period: 'morning', label: 'Morning' },
  { time: '10:00 AM', hour24: 10, period: 'morning', label: 'Morning' },
  { time: '11:00 AM', hour24: 11, period: 'morning', label: 'Late Morning' },

  // Afternoon (12pm - 5pm)
  { time: '12:00 PM', hour24: 12, period: 'afternoon', label: 'Noon' },
  { time: '01:00 PM', hour24: 13, period: 'afternoon', label: 'Afternoon' },
  { time: '02:00 PM', hour24: 14, period: 'afternoon', label: 'Afternoon' },
  { time: '03:00 PM', hour24: 15, period: 'afternoon', label: 'Afternoon' },
  { time: '04:00 PM', hour24: 16, period: 'afternoon', label: 'Late Afternoon' },
  { time: '05:00 PM', hour24: 17, period: 'afternoon', label: 'Late Afternoon' },

  // Evening / Night (6pm - 11pm)
  { time: '06:00 PM', hour24: 18, period: 'evening', label: 'Evening' },
  { time: '07:00 PM', hour24: 19, period: 'evening', label: 'Evening' },
  { time: '08:00 PM', hour24: 20, period: 'evening', label: 'Evening' },
  { time: '09:00 PM', hour24: 21, period: 'evening', label: 'Night' },
  { time: '10:00 PM', hour24: 22, period: 'evening', label: 'Night' },
  { time: '11:00 PM', hour24: 23, period: 'evening', label: 'Late Night' },
];

export const HourPicker: React.FC<HourPickerProps> = ({
  selectedHour,
  onSelectHour,
  hoursCount,
  onChangeHoursCount,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');

  const filteredHours = ALL_24_HOURS.filter((h) => {
    if (periodFilter === 'all') return true;
    return h.period === periodFilter;
  });

  // Calculate calculated end hour string
  const calculateEndTime = () => {
    const found = ALL_24_HOURS.find((h) => h.time === selectedHour);
    if (!found) return '';
    const end24 = (found.hour24 + hoursCount) % 24;
    const endHour = ALL_24_HOURS.find((h) => h.hour24 === end24);
    return endHour ? endHour.time : '';
  };

  const endTimeStr = calculateEndTime();

  const handleDecrementHours = () => {
    if (hoursCount > 1) {
      onChangeHoursCount(hoursCount - 1);
    }
  };

  const handleIncrementHours = () => {
    if (hoursCount < 24) {
      onChangeHoursCount(hoursCount + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. HOW MANY HOURS (DURATION) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            How Many Hours? (Duration)
          </label>
          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
            {hoursCount} {hoursCount === 1 ? 'Hour' : 'Hours'}
          </span>
        </div>

        {/* Counter and presets */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Stepper Controls */}
          <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
            <button
              type="button"
              onClick={handleDecrementHours}
              disabled={hoursCount <= 1}
              className="p-3 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Decrease hour"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 font-bold text-base text-slate-900 min-w-[70px] text-center select-none">
              {hoursCount} hr{hoursCount > 1 ? 's' : ''}
            </div>
            <button
              type="button"
              onClick={handleIncrementHours}
              disabled={hoursCount >= 24}
              className="p-3 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Increase hour"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick hour pills */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {[1, 2, 3, 4, 5, 6, 8, 12].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onChangeHoursCount(h)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  hoursCount === h
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Ending time preview */}
        {selectedHour && endTimeStr && (
          <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100">
            <span>Session Window:</span>
            <span className="font-semibold text-slate-800">
              {selectedHour} &rarr; {endTimeStr} ({hoursCount} hr{hoursCount > 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      {/* 2. SELECT STARTING HOUR (ANY HOUR OF DAY OR NIGHT) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Select Starting Hour (Day &amp; Night)
            </h3>
          </div>
          {selectedHour && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">
              Selected: {selectedHour}
            </span>
          )}
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setPeriodFilter('all')}
            className={`py-1.5 px-2.5 rounded-lg font-semibold transition-colors shrink-0 cursor-pointer ${
              periodFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 24h
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('morning')}
            className={`py-1.5 px-2.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
              periodFilter === 'morning'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sunrise className="w-3 h-3 text-amber-500" />
            <span>Morning (6am-12pm)</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('afternoon')}
            className={`py-1.5 px-2.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
              periodFilter === 'afternoon'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sun className="w-3 h-3 text-amber-500" />
            <span>Afternoon (12pm-6pm)</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('evening')}
            className={`py-1.5 px-2.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
              periodFilter === 'evening'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sunset className="w-3 h-3 text-orange-500" />
            <span>Evening (6pm-12am)</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('night')}
            className={`py-1.5 px-2.5 rounded-lg font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
              periodFilter === 'night'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Moon className="w-3 h-3 text-indigo-500" />
            <span>Night (12am-6am)</span>
          </button>
        </div>

        {/* 24-Hour Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {filteredHours.map(({ time, label, period }) => {
            const isSelected = selectedHour === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => onSelectHour(time)}
                className={`min-h-[46px] py-2 px-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-1'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300 active:scale-95'
                }`}
              >
                <span>{time}</span>
                <span
                  className={`text-[9px] uppercase tracking-wider block ${
                    isSelected ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Direct native time picker fallback for instant mobile selection */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Or choose from full dropdown:</span>
          <select
            value={selectedHour}
            onChange={(e) => onSelectHour(e.target.value)}
            className="py-1 px-2.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            {ALL_24_HOURS.map(({ time, label }) => (
              <option key={time} value={time}>
                {time} &mdash; {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
