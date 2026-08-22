import React, { useState, useEffect } from 'react';
import { History, Shield, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ActivityTab({ activityLogs, onRefresh }) {
  const [logs, setLogs] = useState(activityLogs || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/activity/logs?limit=50');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.warn('Failed to fetch activity logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-brand-400" />
            Real-Time AI Activity & Audit Stream
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all autonomous background decisions, customer conversations, and vendor negotiations.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="bg-surface-900 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-2xl bg-surface-900/80 border border-slate-800 overflow-hidden divide-y divide-slate-800/60 text-xs">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No activity logs recorded yet.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-slate-800/30 transition flex items-start gap-3">
              <span
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  log.severity === 'urgent'
                    ? 'bg-rose-500 ring-4 ring-rose-500/20'
                    : log.severity === 'warning'
                    ? 'bg-amber-500 ring-4 ring-amber-500/20'
                    : 'bg-emerald-400 ring-4 ring-emerald-400/20'
                }`}
              ></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-white font-semibold text-xs truncate">{log.title}</strong>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{log.time_display || log.timestamp}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{log.detail}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-surface-950 border border-slate-800 text-slate-400">
                    Agent: {log.agent_name || 'System'}
                  </span>
                  <span>•</span>
                  <span>{log.automated ? '⚡ Fully Autonomous' : '👤 Owner Action'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
