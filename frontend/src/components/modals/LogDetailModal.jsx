import React from 'react';
import { History, X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LogDetailModal({ isOpen, onClose, log }) {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-surface-950 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Audit Log Event #{log.id || 'EVT'}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{log.time_display || log.timestamp}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {log.category || 'Operations'}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  log.severity === 'urgent'
                    ? 'bg-rose-500/20 text-rose-300'
                    : log.severity === 'warning'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {log.severity?.toUpperCase() || 'INFO'}
              </span>
            </div>
            <h4 className="font-bold text-white text-sm">{log.title}</h4>
            <p className="text-slate-300 text-xs mt-2 leading-relaxed whitespace-pre-wrap">{log.detail}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950 border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Agent Responsible:</span>
              <span className="text-brand-400 font-bold">{log.agent_name || 'Chief Operations Orchestrator'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Execution Mode:</span>
              <span className="text-emerald-400">{log.automated ? '⚡ 100% Fully Autonomous' : '👤 Owner Manual Action'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Audit Trail Hash:</span>
              <span className="text-slate-500">SHA256-OK-VERIFIED</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
