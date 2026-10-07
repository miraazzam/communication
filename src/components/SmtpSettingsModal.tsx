import React, { useState } from 'react';
import { AppConfig, SmtpConfig } from '../types';
import { X, Mail, ShieldCheck, Key, Download, Send, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface SmtpSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (updated: Partial<AppConfig>) => Promise<void>;
  onSendTestEmail: () => Promise<string>;
  onDownloadZip: () => void;
}

export const SmtpSettingsModal: React.FC<SmtpSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSendTestEmail,
  onDownloadZip,
}) => {
  const [ownerEmail, setOwnerEmail] = useState(config.ownerEmail);
  const [smtpUser, setSmtpUser] = useState(config.smtp?.user || config.ownerEmail || '');
  const [smtpPass, setSmtpPass] = useState(config.smtp?.pass || '');
  const [smtpHost, setSmtpHost] = useState(config.smtp?.host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(config.smtp?.port || 465);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTestResult(null);
    try {
      const updatedSmtp: SmtpConfig = {
        host: smtpHost.trim(),
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        from: `"${config.businessName}" <${smtpUser.trim()}>`,
      };

      await onSaveConfig({
        ownerEmail: ownerEmail.trim(),
        smtp: updatedSmtp,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const msg = await onSendTestEmail();
      setTestResult({ success: true, message: msg });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test email failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Host Settings &amp; Real Email Delivery
              </h3>
              <p className="text-xs text-slate-500">
                Download project code &amp; configure real email notifications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: DOWNLOAD PROJECT CODE */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm sm:text-base text-white">
                  Download Project Source Code
                </h4>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Ready
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Export the entire clean codebase (TypeScript, React, Tailwind CSS, Express backend, and email templates) as a complete <code className="text-emerald-300 font-mono">.zip</code> archive.
            </p>
            <button
              type="button"
              onClick={onDownloadZip}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download Project (.ZIP)</span>
            </button>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-200">Want a permanent 24/7 public website link?</span>
              <p>Download this ZIP and deploy it for free on <strong className="text-emerald-400">Render.com</strong> or <strong className="text-emerald-400">Railway.app</strong> to get a permanent domain that never goes to sleep.</p>
            </div>
          </div>

          {/* Section 2: REAL EMAIL EXPLANATION */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-2 text-blue-900">
            <div className="font-bold flex items-center gap-1.5 text-sm text-blue-950">
              <HelpCircle className="w-4 h-4 text-blue-700" />
              <span>Why Didn't You Receive the Email in Gmail Yet?</span>
            </div>
            <p className="leading-relaxed text-blue-800">
              By default, applications in development capture all emails in the internal <strong>Sent Emails Outbox</strong> so they can be previewed without requiring an email account.
            </p>
            <p className="leading-relaxed text-blue-800">
              To have emails delivered <strong>directly into your real Gmail inbox ({config.ownerEmail})</strong>, enter a Gmail App Password below.
            </p>
          </div>

          {/* Section 3: GMAIL SMTP CONFIG FORM */}
          <form onSubmit={handleSave} className="space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-700" />
              <span>Connect Gmail for Real Email Delivery</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Notification Email
              </label>
              <input
                type="email"
                required
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Account Email (Sender)
              </label>
              <input
                type="email"
                required
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="mira.azzam137@gmail.com"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Google App Password (16 characters)
                </label>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Get App Password &rarr;
                </a>
              </div>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                How to get it in 30 seconds: Go to <strong>Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords</strong>, name it "Bookings", and paste the 16 letters here.
              </p>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>{testResult.message}</div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="w-full sm:w-auto py-2 px-3.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Sending Test...' : 'Send Test Email'}</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Saved!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto py-2 px-5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
