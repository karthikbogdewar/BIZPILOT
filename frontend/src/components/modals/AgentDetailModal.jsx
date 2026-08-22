import React, { useState } from 'react';
import { Bot, X, Play, CheckCircle2, Activity, Zap, Power } from 'lucide-react';

export default function AgentDetailModal({
  isOpen,
  onClose,
  agent,
  showToast
}) {
  const [taskResult, setTaskResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  if (!isOpen || !agent) return null;

  const handleRunTask = async (taskName) => {
    setIsRunning(true);
    setTaskResult(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_name: taskName, payload: {} })
      });
      const data = await res.json();
      setTaskResult(data);
      showToast('Task Executed! ⚡', `Agent '${agent.name}' completed '${taskName}'.`, 'success');
    } catch (err) {
      setTaskResult({ success: false, error: err.message });
      showToast('Execution Error', err.message, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleAgent = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    showToast(
      newState ? 'Agent Activated 🟢' : 'Agent Paused ⏸️',
      `${agent.name} is now ${newState ? 'autonomously monitoring' : 'paused by owner'}.`,
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-brand-500/40 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-brand-950/90 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    isEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isEnabled ? agent.status || 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <p className="text-[11px] text-brand-300 font-mono">{agent.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Description & Autonomy Toggle */}
          <div className="p-3.5 rounded-xl bg-surface-950 border border-slate-800 flex items-start justify-between gap-4">
            <p className="text-slate-300 text-xs leading-relaxed flex-1">{agent.description}</p>
            <button
              onClick={toggleAgent}
              className={`px-3 py-1.5 rounded-lg font-semibold text-[11px] flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                isEnabled
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">Tasks Completed</span>
              <strong className="text-white text-base font-mono font-bold">48</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">Success Rate</span>
              <strong className="text-emerald-400 text-base font-mono font-bold">99.2%</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">Avg Latency</span>
              <strong className="text-sky-400 text-base font-mono font-bold">180ms</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-mono">Last Run</span>
              <strong className="text-brand-300 text-xs font-mono font-bold block mt-0.5">2m ago</strong>
            </div>
          </div>

          {/* Autonomous Task Triggers */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Execute Agent Tasks On-Demand:
            </h4>
            <div className="flex flex-wrap gap-2">
              {(agent.tasks || [{ name: 'health_check', label: 'Run Diagnostic Check' }]).map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunTask(t.name)}
                  disabled={isRunning || !isEnabled}
                  className="px-3 py-2 rounded-xl bg-surface-950 hover:bg-brand-600/30 text-slate-200 hover:text-white border border-slate-800 hover:border-brand-500/40 text-xs font-medium transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3 text-brand-400 fill-current" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Execution Result Terminal */}
          {isRunning && (
            <div className="p-3 rounded-xl bg-brand-950/40 border border-brand-500/30 text-brand-300 text-xs flex items-center gap-2 animate-pulse">
              <Activity className="w-4 h-4 animate-spin" />
              <span>Executing autonomous agent cycle with SQLite database grounding...</span>
            </div>
          )}

          {taskResult && (
            <div className="p-3.5 rounded-xl bg-surface-950 border border-brand-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Output Manifest & Result
                </span>
                <button
                  onClick={() => setTaskResult(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
                >
                  Clear
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-surface-900 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-48">
                {JSON.stringify(taskResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
