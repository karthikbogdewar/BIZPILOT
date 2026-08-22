import React, { useState, useEffect } from 'react';
import { Receipt, Send, CheckCircle2, X } from 'lucide-react';

export default function KhataReminderModal({ isOpen, onClose, invoice, showToast }) {
  const [tone, setTone] = useState('polite');
  const [language, setLanguage] = useState('te');
  const [preview, setPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      fetchReminderPreview();
    }
  }, [isOpen, invoice, tone, language]);

  const fetchReminderPreview = async () => {
    try {
      const res = await fetch('/api/khata/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice?.id || 'INV-1002',
          tone: tone,
          language: language
        })
      });
      const data = await res.json();
      setPreview(data);
    } catch (e) {
      console.warn('Failed to fetch reminder preview:', e);
    }
  };

  const handleSendReminder = async () => {
    setIsSending(true);
    try {
      showToast('Khata Reminder Sent! 📱', `Sent to ${invoice?.customer_name} via WhatsApp with instant UPI link.`, 'success');
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-amber-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/80 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Customer Khata (Credit) Payment Reminder
              </h3>
              <p className="text-[11px] text-slate-400">
                Invoice {invoice?.id} • {invoice?.customer_name} (₹{invoice?.amount})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Escalation Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value="polite">😊 Polite Nudge</option>
                <option value="formal">💼 Formal Notice</option>
                <option value="urgent">🚨 Urgent Credit Freeze</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="en">English</option>
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>
          </div>

          {/* Message Preview */}
          {preview && (
            <div className="p-4 rounded-xl bg-surface-950 border border-amber-500/40 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">
                📱 Live Message Preview:
              </span>
              <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                {preview.message_text}
              </p>
            </div>
          )}

          <button
            onClick={handleSendReminder}
            disabled={isSending}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer text-xs"
          >
            <Send className="w-4 h-4" />
            <span>Send Reminder via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
