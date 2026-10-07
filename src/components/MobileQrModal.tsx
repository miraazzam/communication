import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Copy, Check, ExternalLink, QrCode } from 'lucide-react';

interface MobileQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileQrModal: React.FC<MobileQrModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Use the canonical public URL or current location
  const appUrl = typeof window !== 'undefined'
    ? (window.location.origin.includes('localhost')
        ? 'https://ais-pre-csfpfbmbl3q3p3c2nm3o4j-564645189045.europe-west3.run.app'
        : window.location.origin)
    : 'https://ais-pre-csfpfbmbl3q3p3c2nm3o4j-564645189045.europe-west3.run.app';

  useEffect(() => {
    if (isOpen && appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code', err));
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 text-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-left">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Open on Your Phone</h3>
              <p className="text-[11px] text-slate-500">Scan or copy your live website link</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block mx-auto mb-4 shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan to open on phone"
              className="w-48 h-48 rounded-lg mx-auto"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
              Generating QR Code...
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Open your phone's <strong>Camera app</strong> and point it at this screen to open the booking page directly on your mobile device.
        </p>

        {/* Copy Link Input */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs mb-3">
          <span className="truncate flex-1 px-2 text-slate-700 font-mono text-[11px] text-left select-all">
            {appUrl}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-1.5 px-3 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 text-[11px]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span>&check; 100% Mobile Optimized</span>
          <span>&middot;</span>
          <span>iPhone &amp; Android</span>
        </div>
      </div>
    </div>
  );
};
