import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import LogDetailModal from '../modals/LogDetailModal';

export default function ActivityTab({ activityLogs, onRefresh }) {
  const [logs, setLogs] = useState(activityLogs || []);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/activity/logs?limit=100');
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

  const categories = ['All', 'Operations', 'Inventory', 'Finance', 'Procurement', 'Safety'];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.agent_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'All' ||
      log.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-brand-400" />
            Real-Time AI Activity & Audit Stream
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable cryptographic audit trail of all background decisions, customer conversations, and vendor negotiations.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="bg-surface-900 hover:bg-slate-800 text-slate-300 text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium transition shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20'
                  : 'bg-surface-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-surface-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-full md:w-64"
          />
        </div>
      </div>

      {/* Activity Logs Stream List */}
      <div className="rounded-2xl bg-surface-900/80 border border-slate-800 overflow-hidden divide-y divide-slate-800/60 text-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No activity logs matching the filter.</div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="p-4 hover:bg-slate-800/30 transition flex items-start gap-3 cursor-pointer group"
            >
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
                  <strong className="text-white font-semibold text-xs truncate group-hover:text-brand-300 transition">
                    {log.title}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {log.time_display || log.timestamp}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{log.detail}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-surface-950 border border-slate-800 text-brand-400">
                    Agent: {log.agent_name || 'Chief Operations Orchestrator'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400">
                    {log.automated ? '⚡ Fully Autonomous' : '👤 Owner Action'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Detail Modal */}
      <LogDetailModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}
