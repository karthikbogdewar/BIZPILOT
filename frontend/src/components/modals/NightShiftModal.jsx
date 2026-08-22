import React, { useState, useEffect } from 'react';
import { Moon, Play, CheckCircle2, X } from 'lucide-react';

export default function NightShiftModal({ isOpen, onClose, showToast }) {
  const [timeline, setTimeline] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runSimulation();
    }
  }, [isOpen]);

  const runSimulation = async () => {
    setIsRunning(true);
    setTimeline([]);
    try {
      const res = await fetch('/api/simulator/night-shift', { method: 'POST' });
      const data = await res.json();
      
      // Animate items one by one for live time-machine sensation
      for (let i = 0; i < data.timeline.length; i++) {
        setTimeline((prev) => [...prev, data.timeline[i]]);
        await new Promise((r) => setTimeout(r, 220));
      }
      showToast('Autonomous 24h Shift Complete! 🌙', 'All 8 autonomous operations executed with zero human friction.', 'success');
    } catch (err) {
      showToast('Simulation Error', err.message, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-purple-500/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-purple-950/80 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                "While You Slept" 24-Hour Autonomous Shift Time Machine
              </h3>
              <p className="text-[11px] text-slate-400">
                Simulating an entire 24-hour business cycle in 5.0 seconds
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Stream */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {timeline.map((item, idx) => (
            <div key={idx} className="relative pl-6 pb-2 border-l-2 border-purple-500/30 last:border-0">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-purple-400 ring-4 ring-surface-900"></div>
              <div className="p-3 rounded-xl bg-surface-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-400 text-[11px] font-bold">{item.time}</span>
                    <strong className="text-white">{item.title}</strong>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold text-[11px]">{item.financial_impact}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{item.detail}</p>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-surface-900 border border-slate-800 text-slate-400">{item.agent_name}</span>
                  <span>•</span>
                  <span>Phase: {item.phase}</span>
                </div>
              </div>
            </div>
          ))}

          {isRunning && (
            <div className="text-center py-4 text-purple-400 text-xs flex items-center justify-center gap-2 animate-pulse font-mono">
              <Moon className="w-4 h-4 animate-spin" /> Accelerating operations shift...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-surface-950 border-t border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-3 py-1.5 cursor-pointer">
            Close
          </button>
          <button
            onClick={runSimulation}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Re-run 24h Autonomous Shift</span>
          </button>
        </div>
      </div>
    </div>
  );
}
