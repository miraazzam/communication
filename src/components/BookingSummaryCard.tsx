import React from 'react';
import { ServiceOption } from '../types';
import { Calendar, Clock, DollarSign, Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface BookingSummaryCardProps {
  selectedService: ServiceOption;
  selectedDate: string;
  selectedHour: string;
  hoursCount: number;
  totalPrice: number;
  currency: string;
  ownerEmail: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  canSubmit: boolean;
}

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  selectedService,
  selectedDate,
  selectedHour,
  hoursCount,
  totalPrice,
  currency,
  ownerEmail,
  isSubmitting,
  onSubmit,
  canSubmit,
}) => {
  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Select date';

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl sticky top-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <h3 className="font-semibold text-lg text-white">Booking Summary</h3>
        <span className="text-xs text-slate-400">Live Breakdown</span>
      </div>

      <div className="py-4 space-y-3.5 text-sm">
        {/* Service */}
        <div className="flex items-start justify-between">
          <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Service</div>
          <div className="font-medium text-white text-right max-w-[60%]">
            {selectedService.name}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date</span>
          </div>
          <div className="font-medium text-white">
            {selectedDate ? formattedDate : <span className="text-slate-500 italic">Not chosen</span>}
          </div>
        </div>

        {/* Hour / Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Time & Duration</span>
          </div>
          <div className="font-medium text-white">
            {selectedHour ? (
              <span>
                {selectedHour} ({hoursCount} hr{hoursCount > 1 ? 's' : ''})
              </span>
            ) : (
              <span className="text-slate-500 italic">Select hour</span>
            )}
          </div>
        </div>

        {/* Price computation */}
        <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Rate</span>
            <span>{currency}{selectedService.ratePerHour} &times; {hoursCount} hr{hoursCount > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-white font-semibold text-base">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Total Price</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {currency}{totalPrice}
            </div>
          </div>
        </div>
      </div>

      {/* Structured email target info */}
      <div className="my-3.5 p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <Mail className="w-3.5 h-3.5" />
          <span>Direct Email Notification</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          All booking fields, hours, and special requests are instantly dispatched to <span className="text-slate-200 font-semibold">{ownerEmail}</span>.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
        className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-98"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending to Host Email...</span>
          </>
        ) : (
          <>
            <span>Confirm & Submit Booking</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Owner reviews & sends acceptance to your email</span>
      </div>
    </div>
  );
};
