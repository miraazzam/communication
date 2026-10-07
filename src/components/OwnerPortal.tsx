import React, { useState } from 'react';
import { Booking } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  Send, 
  AlertCircle,
  Sparkles,
  Inbox,
  Filter,
  DollarSign
} from 'lucide-react';

interface OwnerPortalProps {
  bookings: Booking[];
  currency: string;
  ownerEmail: string;
  onRespondBooking: (bookingId: string, status: 'accepted' | 'declined', reason: string) => Promise<void>;
  onRefresh: () => void;
  onOpenEmailInspector: () => void;
  onBackToPublic?: () => void;
  onOpenSettings?: () => void;
  hasSmtpConfigured?: boolean;
}

export const OwnerPortal: React.FC<OwnerPortalProps> = ({
  bookings,
  currency,
  ownerEmail,
  onRespondBooking,
  onRefresh,
  onOpenEmailInspector,
  onBackToPublic,
  onOpenSettings,
  hasSmtpConfigured,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [decisionType, setDecisionType] = useState<'accepted' | 'declined'>('accepted');
  const [reasonText, setReasonText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  const acceptPresets = [
    'Confirmed! Looking forward to meeting with you.',
    'Your reservation is approved. Please be ready 5 minutes early.',
    'All set! Excited to collaborate on your project.',
  ];

  const declinePresets = [
    'Unfortunately, I have an unavoidable scheduling conflict at this hour.',
    'Regrettably I am fully booked during this time window. Please rebook another date.',
    'I am unavailable at this specific hour, but tomorrow morning has open availability.',
  ];

  const handleOpenDecision = (booking: Booking, type: 'accepted' | 'declined') => {
    setActiveBookingId(booking.id);
    setDecisionType(type);
    if (type === 'accepted') {
      setReasonText(acceptPresets[0]);
    } else {
      setReasonText(declinePresets[0]);
    }
  };

  const handleCloseDecision = () => {
    setActiveBookingId(null);
    setReasonText('');
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBookingId) return;

    setIsSubmitting(true);
    try {
      await onRespondBooking(activeBookingId, decisionType, reasonText);
      const targetBooking = bookings.find((b) => b.id === activeBookingId);
      setNotificationMsg(
        `Decision email successfully sent to ${targetBooking?.clientEmail || 'the user'} (${decisionType.toUpperCase()})`
      );
      setTimeout(() => setNotificationMsg(null), 5000);
      handleCloseDecision();
    } catch (err: any) {
      alert(`Error submitting decision: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900">Owner Booking Inquiries</h2>
              {pendingCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {pendingCount} Pending Action
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              Review incoming client requests, accept or decline with a custom reason, and send decision emails to the user.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onBackToPublic && (
              <button
                type="button"
                onClick={onBackToPublic}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>&larr; Public Booking View</span>
              </button>
            )}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Email Setup &amp; Download Code</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenEmailInspector}
              className="py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" />
              <span>Sent Emails Log</span>
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Refresh List
            </button>
          </div>
        </div>

        {!hasSmtpConfigured && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Real Gmail Notifications Inactive:</strong> Bookings submitted from phones &amp; laptops are saved in your app's Sent Outbox, but won't ping your phone's Gmail app until you add a Gmail App Password.
              </div>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shrink-0 cursor-pointer self-start sm:self-auto shadow-xs"
              >
                Set Up Live Gmail &rarr;
              </button>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-1 pt-4 overflow-x-auto text-xs">
          <div className="flex items-center gap-1 text-slate-600 mr-2 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          {(['all', 'pending', 'accepted', 'declined'] as const).map((st) => {
            const count = st === 'all' ? bookings.length : bookings.filter((b) => b.status === st).length;
            const isActive = filter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`py-1.5 px-3 rounded-lg font-medium capitalize transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notificationMsg}</span>
          </div>
          <button
            type="button"
            onClick={onOpenEmailInspector}
            className="text-emerald-700 underline font-semibold text-xs ml-4 cursor-pointer"
          >
            View in Sent Outbox
          </button>
        </div>
      )}

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">No bookings match this filter</h3>
          <p className="text-xs text-slate-500">
            {filter === 'all'
              ? 'New reservations submitted through the form will appear here.'
              : `There are currently no bookings with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isPending = b.status === 'pending';
            const isAccepted = b.status === 'accepted';
            const isDeclined = b.status === 'declined';
            const isComposingThis = activeBookingId === b.id;

            return (
              <div
                key={b.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      #{b.id}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{b.clientName}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{b.serviceName}</span>
                        <span>&middot;</span>
                        <span>{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Review
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accepted & Emailed
                      </span>
                    )}
                    {isDeclined && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Declined & Emailed
                      </span>
                    )}
                  </div>
                </div>

                {/* Booking details grid */}
                <div className="py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block mb-1">Date & Time</span>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span>{b.date}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      {b.timeSlot} ({b.hours} hr{b.hours > 1 ? 's' : ''})
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block mb-1">Client Proposed Price</span>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1 text-emerald-700">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{currency}{b.totalPrice}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Client-offered amount
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block mb-1">Contact Email</span>
                    <a
                      href={`mailto:${b.clientEmail}`}
                      className="font-medium text-blue-600 hover:underline flex items-center gap-1.5 truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{b.clientEmail}</span>
                    </a>
                    {b.clientPhone && (
                      <div className="text-slate-600 mt-0.5 flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{b.clientPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block mb-1">Special Request</span>
                    <div className="text-slate-800 line-clamp-2 italic">
                      {b.specialRequest ? `"${b.specialRequest}"` : 'None specified'}
                    </div>
                  </div>
                </div>

                {/* If already decided, show what message was emailed to the user */}
                {!isPending && b.ownerDecisionReason && (
                  <div className="my-2 p-3.5 rounded-xl border bg-slate-50 border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                        Message Emailed to Client ({b.clientEmail})
                      </span>
                      {b.ownerDecisionAt && (
                        <span className="text-slate-400 text-[11px]">
                          Sent on {new Date(b.ownerDecisionAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-900 italic font-serif text-sm">
                      &ldquo;{b.ownerDecisionReason}&rdquo;
                    </p>
                  </div>
                )}

                {/* Decision Composer or Action Buttons */}
                {isComposingThis ? (
                  <form
                    onSubmit={handleSubmitDecision}
                    className="mt-4 p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {decisionType === 'accepted' ? (
                          <div className="p-1 rounded bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1 rounded bg-rose-100 text-rose-700">
                            <XCircle className="w-4 h-4" />
                          </div>
                        )}
                        <span className="text-sm font-bold text-slate-900">
                          {decisionType === 'accepted' ? 'Accept Booking' : 'Decline Booking'} &amp; Email {b.clientName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCloseDecision}
                        className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="text-xs text-slate-600">
                      Why did you {decisionType} this booking? This explanation will be included in the structured email sent to <span className="font-semibold text-slate-800">{b.clientEmail}</span>:
                    </div>

                    {/* Quick presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {(decisionType === 'accepted' ? acceptPresets : declinePresets).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReasonText(preset)}
                          className="py-1 px-2.5 rounded-md text-[11px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                        >
                          &ldquo;{preset.slice(0, 38)}...&rdquo;
                        </button>
                      ))}
                    </div>

                    <textarea
                      required
                      rows={3}
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                      placeholder={decisionType === 'accepted' ? 'Write instructions or notes for the client...' : 'State the reason for declining (e.g. time conflict, please reschedule)...'}
                      className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCloseDecision}
                        className="py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !reasonText.trim()}
                        className={`py-2 px-4 text-xs font-semibold rounded-lg text-white transition-all flex items-center gap-1.5 cursor-pointer ${
                          decisionType === 'accepted'
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : 'bg-rose-600 hover:bg-rose-500'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {isSubmitting ? 'Sending Email...' : `Confirm & Send Email to ${b.clientName}`}
                        </span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(b, 'declined')}
                          className="py-2 px-4 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline Request</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(b, 'accepted')}
                          className="py-2 px-4 text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Accept Request</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDecision(b, isAccepted ? 'declined' : 'accepted')}
                          className="py-1.5 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Change to {isAccepted ? 'Declined' : 'Accepted'} &amp; Resend Email
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
