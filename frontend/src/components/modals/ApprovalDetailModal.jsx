import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  Check,
  Ban,
  Clock,
  Send,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

export default function ApprovalDetailModal({
  isOpen,
  onClose,
  approval,
  onApprove,
  onReject,
  onRequestChanges,
  showToast
}) {
  const [feedback, setFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  if (!isOpen || !approval) return null;

  const isPending = approval.status === 'Pending';

  const handleRequestChangesSubmit = () => {
    if (onRequestChanges) {
      onRequestChanges(approval.id, feedback || 'Owner requested adjustments to quantities/pricing');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-amber-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/90 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Decision Card #{approval.id}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    approval.status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : approval.status === 'Pending'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {approval.status || 'Pending'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Human-in-the-Loop Operations Guardrail</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1.5">
              {approval.type || 'PURCHASE_ORDER'}
            </span>
            <h4 className="font-bold text-white text-sm">{approval.title}</h4>
            <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">{approval.recommendation}</p>
          </div>

          {/* Financial Breakdown */}
          {approval.amount && (
            <div className="p-3.5 rounded-xl bg-surface-950 border border-slate-800 flex items-center justify-between font-mono">
              <span className="text-slate-400 font-sans">Financial Value / PO Cost:</span>
              <strong className="text-white text-base font-bold">
                ₹{Number(approval.amount).toLocaleString('en-IN')}
              </strong>
            </div>
          )}

          {/* AI Justification & Safety Parameters */}
          <div className="p-3.5 rounded-xl bg-brand-950/30 border border-brand-500/30 space-y-1.5">
            <span className="text-[10px] font-mono text-brand-300 font-bold block">
              🛡️ Autonomous Engine Audit Justification:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Exceeds the ₹5,000 threshold set in your Business Profile. Autonomous engine pre-scored 3 vendors and picked the lowest unit cost with 3-day delivery buffer.
            </p>
          </div>

          {/* Request Changes Form */}
          {showFeedbackInput && (
            <div className="p-3.5 rounded-xl bg-surface-950 border border-slate-700 space-y-2">
              <label className="text-slate-300 font-semibold block">Revision Notes for AI Agent:</label>
              <textarea
                rows={2}
                placeholder="e.g. Reduce reorder to 15 units or negotiate 10% discount first..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full bg-surface-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-amber-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowFeedbackInput(false)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChangesSubmit}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs"
                >
                  Submit Changes
                </button>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {isPending && (
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onReject(approval.id);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 font-semibold transition cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowFeedbackInput(!showFeedbackInput)}
                  className="px-3 py-2 rounded-xl text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 font-semibold transition cursor-pointer"
                >
                  Request Changes
                </button>
              </div>

              <button
                onClick={() => {
                  onApprove(approval.id);
                  onClose();
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Authorize</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
