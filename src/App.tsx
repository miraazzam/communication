import React, { useState, useEffect } from 'react';
import { CalendarPicker } from './components/CalendarPicker';
import { HourPicker } from './components/HourPicker';
import { OwnerPortal } from './components/OwnerPortal';
import { EmailInspectorModal } from './components/EmailInspectorModal';
import { SmtpSettingsModal } from './components/SmtpSettingsModal';
import { MobileQrModal } from './components/MobileQrModal';
import { Booking, AppConfig } from './types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  DollarSign, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Download,
  Loader2, 
  Sparkles,
  Settings,
  Smartphone
} from 'lucide-react';

export default function App() {
  // App Config
  const [config, setConfig] = useState<AppConfig>({
    ownerEmail: 'mira.azzam137@gmail.com',
    ownerName: 'Mira Azzam',
    businessName: 'Appointments with Mira Azzam',
    currency: '$',
    hourlyRate: 50,
  });

  // Owner Mode State - Hidden from public visitors
  const [isOwnerView, setIsOwnerView] = useState<boolean>(false);
  const [showHostPinModal, setShowHostPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetchingBookings, setIsFetchingBookings] = useState<boolean>(false);

  // Form State
  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowString());
  const [selectedHour, setSelectedHour] = useState<string>('10:00 AM');
  const [hoursCount, setHoursCount] = useState<number>(1);
  
  // The person booking decides the price!
  const [proposedPrice, setProposedPrice] = useState<string>('50');
  const [specialRequest, setSpecialRequest] = useState<string>('');

  // Client Details
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);

  // Modals
  const [isEmailInspectorOpen, setIsEmailInspectorOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Check URL parameters for direct owner access (?owner=true or #owner)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('owner') === 'true' || window.location.hash === '#owner') {
      setIsOwnerView(true);
    }
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error('Error fetching config', e);
    }
  };

  const loadBookings = async () => {
    setIsFetchingBookings(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error('Error fetching bookings', e);
    } finally {
      setIsFetchingBookings(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadBookings();
  }, []);

  const numericProposedPrice = Number(proposedPrice) > 0 ? Number(proposedPrice) : 50;

  const canSubmit = Boolean(
    clientName.trim() &&
    clientEmail.trim() &&
    selectedDate &&
    selectedHour &&
    numericProposedPrice > 0
  );

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      alert('Please fill out your Name, Email, Date, Time, and Proposed Price to submit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        clientPhone: clientPhone.trim(),
        date: selectedDate,
        timeSlot: selectedHour,
        hours: hoursCount,
        totalPrice: numericProposedPrice,
        specialRequest: specialRequest.trim(),
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      setSubmittedBooking(data.booking);
      await loadBookings();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      alert(`Submission error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondBooking = async (
    bookingId: string,
    status: 'accepted' | 'declined',
    reason: string
  ) => {
    const res = await fetch(`/api/bookings/${bookingId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to respond to booking');
    }

    await loadBookings();
  };

  const handleSaveConfig = async (updated: Partial<AppConfig>) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save config');
    }

    await loadConfig();
  };

  const handleSendTestEmail = async (): Promise<string> => {
    const res = await fetch('/api/test-email', {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send test email');
    }
    return data.message;
  };

  const handleDownloadZip = () => {
    window.location.href = '/api/download-zip';
  };

  const handleHostLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput.trim() === '') {
      setIsOwnerView(true);
      setShowHostPinModal(false);
      setPinInput('');
      setPinError(null);
    } else {
      setPinError('Incorrect PIN. (Default is 1234)');
    }
  };

  const resetFormAfterSubmission = () => {
    setSubmittedBooking(null);
    setSpecialRequest('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* ========================================================= */}
      {/* 1. PUBLIC VISITOR HEADER (Zero owner portal controls)     */}
      {/* ========================================================= */}
      {!isOwnerView ? (
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                M
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base leading-tight">
                  {config.businessName}
                </h1>
                <p className="text-xs text-slate-500">
                  Book an Appointment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Scan QR code to open on your phone"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open on Phone</span>
              </button>
              <div className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200 hidden sm:block">
                You Decide Price
              </div>
            </div>
          </div>
        </header>
      ) : (
        /* Owner Management Top Bar (Only when owner is logged in) */
        <header className="bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-sm sm:text-base">Host Review Panel</span>
              <span className="text-xs text-slate-400 hidden sm:inline">&middot; {config.ownerEmail}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadZip}
                className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                title="Download full project code as ZIP"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download Code (.ZIP)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="py-1.5 px-3 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Email Setup</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOwnerView(false)}
                className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                &larr; Public View
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* ========================================================= */}
        {/* VIEW A: OWNER MANAGEMENT PORTAL                           */}
        {/* ========================================================= */}
        {isOwnerView ? (
          <div className="animate-fadeIn">
            <OwnerPortal
              bookings={bookings}
              currency={config.currency}
              ownerEmail={config.ownerEmail}
              onRespondBooking={handleRespondBooking}
              onRefresh={loadBookings}
              onOpenEmailInspector={() => setIsEmailInspectorOpen(true)}
              onBackToPublic={() => setIsOwnerView(false)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              hasSmtpConfigured={config.hasSmtpConfigured}
            />
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW B: PUBLIC CLIENT BOOKING FORM                        */
          /* ========================================================= */
          <div className="animate-fadeIn">
            {submittedBooking ? (
              /* Success Screen */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Booking Request Sent!
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Reference ID: <span className="font-mono font-bold text-slate-900">#{submittedBooking.id}</span>
                </p>

                {/* Structured Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs sm:text-sm space-y-2.5 mb-6">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-900">{submittedBooking.date}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">What Hour &amp; Duration:</span>
                    <span className="font-semibold text-slate-900">
                      {submittedBooking.timeSlot} ({submittedBooking.hours} hr{submittedBooking.hours > 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Your Proposed Price:</span>
                    <span className="font-bold text-emerald-700 text-base">
                      {config.currency}{submittedBooking.totalPrice}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Your Email:</span>
                    <span className="font-semibold text-slate-900">{submittedBooking.clientEmail}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Special Request:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[60%]">
                      {submittedBooking.specialRequest || 'None'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Your booking request and proposed price have been sent directly to the host for review. You will receive an email once the host accepts or updates your request.
                </p>

                <button
                  type="button"
                  onClick={resetFormAfterSubmission}
                  className="py-2.5 px-6 rounded-xl font-semibold text-xs sm:text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
                >
                  Book Another Appointment
                </button>
              </div>
            ) : (
              /* The Clean One-Page Booking Form */
              <form onSubmit={handleSubmitBooking} className="space-y-6">
                <div className="text-left mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Book an Appointment
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Select your date, what hour you would like, decide your price, and submit your request directly to the host.
                  </p>
                </div>

                {/* 1. CALENDAR PICKER (DATE) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-slate-700" />
                    <h3 className="font-semibold text-slate-900 text-sm">
                      1. Select Date
                    </h3>
                  </div>
                  <CalendarPicker
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                  />
                </div>

                {/* 2. WHAT HOUR & DURATION */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-700" />
                    <h3 className="font-semibold text-slate-900 text-sm">
                      2. What Hour
                    </h3>
                  </div>
                  <HourPicker
                    selectedHour={selectedHour}
                    onSelectHour={setSelectedHour}
                    hoursCount={hoursCount}
                    onChangeHoursCount={setHoursCount}
                  />
                </div>

                {/* 3. DECIDE YOUR PRICE (Pay What You Want) */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-semibold text-slate-900 text-sm">
                        3. Your Price Offer (You Decide)
                      </h3>
                    </div>
                    <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Client-decided
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    How much would you like to pay/offer for this {hoursCount} hour{hoursCount > 1 ? 's' : ''} session?
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-base">
                        {config.currency}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        placeholder="Enter amount (e.g. 50)"
                        className="w-full pl-8 pr-3 py-2.5 text-base font-bold text-slate-900 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    {/* Quick suggestion buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['30', '50', '75', '100'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setProposedPrice(amt)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            proposedPrice === amt
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {config.currency}{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. SPECIAL REQUEST */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      4. Special Request
                    </label>
                    <span className="text-[11px] text-slate-400">Optional</span>
                  </div>
                  <textarea
                    rows={3}
                    value={specialRequest}
                    onChange={(e) => setSpecialRequest(e.target.value)}
                    placeholder="Any specific questions, topics, goals, or preparation instructions for the host?"
                    className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  />
                </div>

                {/* 5. YOUR DETAILS */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                  <h3 className="font-semibold text-slate-900 text-sm">
                    5. Your Contact Information
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      The host's accept or decline decision message will be sent to this email.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. SUBMISSION CARD & GUARANTEE */}
                <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                    <span>Summary:</span>
                    <span className="font-semibold text-white">
                      {formattedDate} &middot; {selectedHour} ({hoursCount}h) &middot; Your Price: {config.currency}{numericProposedPrice}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal">
                    When you click submit, your date, hour, proposed price, and special request are delivered directly to the host for review.
                  </p>

                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Booking...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Booking Request</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div>
            &copy; {new Date().getFullYear()} {config.businessName}
          </div>

          <div className="flex items-center gap-4">
            {/* Low-profile Host Access for Mira */}
            {!isOwnerView ? (
              <button
                type="button"
                onClick={() => setShowHostPinModal(true)}
                className="text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Owner Review Portal"
              >
                <Lock className="w-3 h-3" />
                <span>Host Access</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsOwnerView(false)}
                className="text-slate-700 hover:text-slate-950 font-semibold transition-colors cursor-pointer"
              >
                Exit Host View
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Host Access PIN Dialog */}
      {showHostPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Host Access</h3>
                <p className="text-[11px] text-slate-500">Log in to review bookings &amp; download code</p>
              </div>
            </div>

            <form onSubmit={handleHostLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Host Passcode
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Enter PIN (Default: 1234)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(null);
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                {pinError && (
                  <p className="text-[11px] text-rose-600 mt-1">{pinError}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Default passcode is <code className="bg-slate-100 px-1 rounded">1234</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowHostPinModal(false);
                    setPinError(null);
                    setPinInput('');
                  }}
                  className="py-1.5 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Enter Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smtp Settings & Code Download Modal */}
      <SmtpSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onSendTestEmail={handleSendTestEmail}
        onDownloadZip={handleDownloadZip}
      />

      {/* Email Inspector Modal */}
      <EmailInspectorModal
        isOpen={isEmailInspectorOpen}
        onClose={() => setIsEmailInspectorOpen(false)}
      />

      {/* Mobile QR Code Modal */}
      <MobileQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
