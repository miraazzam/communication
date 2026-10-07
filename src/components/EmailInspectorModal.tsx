import React, { useState, useEffect } from 'react';
import { SentEmail } from '../types';
import { X, Mail, CheckCircle2, ExternalLink, RefreshCw, Eye, Code } from 'lucide-react';

interface EmailInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailInspectorModal: React.FC<EmailInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'html' | 'text'>('preview');
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emails');
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
        if (data.length > 0 && !selectedEmail) {
          setSelectedEmail(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load sent emails', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Sent Emails Outbox &amp; Structured Notification Inspector
              </h3>
              <p className="text-xs text-slate-500">
                View all emails sent by the system with full structured fields and client decision notices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchEmails}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Email list sidebar */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto bg-slate-50/50">
            <div className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              Dispatched Emails ({emails.length})
            </div>
            {emails.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No emails dispatched yet. Submit a booking or respond to test!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {emails.map((em) => {
                  const isSelected = selectedEmail?.id === em.id;
                  const typeLabel =
                    em.type === 'owner_notification'
                      ? 'Owner Notification'
                      : em.type === 'client_decision'
                      ? 'Decision to Client'
                      : 'Client Confirmation';

                  const badgeColor =
                    em.type === 'owner_notification'
                      ? 'bg-blue-100 text-blue-800'
                      : em.type === 'client_decision'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800';

                  return (
                    <button
                      key={em.id}
                      type="button"
                      onClick={() => setSelectedEmail(em)}
                      className={`w-full text-left p-3.5 transition-colors cursor-pointer flex flex-col gap-1 ${
                        isSelected ? 'bg-white shadow-xs border-l-4 border-l-slate-900' : 'hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${badgeColor}`}>
                          {typeLabel}
                        </span>
                        <span className="text-slate-400">
                          {new Date(em.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 line-clamp-1 mt-0.5">
                        {em.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        To: {em.to}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email viewer */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {selectedEmail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Meta details bar */}
                <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {selectedEmail.subject}
                    </h4>
                    {selectedEmail.previewUrl && (
                      <a
                        href={selectedEmail.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium shrink-0 ml-2"
                      >
                        <span>Ethereal Preview</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-600 font-semibold">Recipient: </span>
                      <span className="font-mono text-slate-800">{selectedEmail.to}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-semibold">Booking Ref: </span>
                      <span className="font-mono font-medium text-slate-800">#{selectedEmail.bookingId}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-semibold">Sent At: </span>
                      <span>{new Date(selectedEmail.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-semibold">Delivery Status: </span>
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Dispatched ({selectedEmail.status})
                      </span>
                    </div>
                  </div>

                  {/* Mode switcher */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        viewMode === 'preview'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rendered Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('text')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        viewMode === 'text'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>Structured Plain Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('html')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        viewMode === 'html'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>HTML Source</span>
                    </button>
                  </div>
                </div>

                {/* Email content pane */}
                <div className="flex-1 overflow-auto p-4 bg-slate-100/70">
                  {viewMode === 'preview' && (
                    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden max-w-2xl mx-auto">
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                      />
                    </div>
                  )}

                  {viewMode === 'text' && (
                    <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 max-w-2xl mx-auto">
                      <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {selectedEmail.text}
                      </pre>
                    </div>
                  )}

                  {viewMode === 'html' && (
                    <div className="bg-slate-900 text-slate-100 rounded-xl p-4 shadow-xs overflow-x-auto">
                      <pre className="font-mono text-xs whitespace-pre-wrap text-slate-300">
                        {selectedEmail.html}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Select an email from the left to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
