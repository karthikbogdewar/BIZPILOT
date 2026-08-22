import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign
} from 'lucide-react';

export default function WhatIfTab() {
  const [demandMultiplier, setDemandMultiplier] = useState(2.0);
  const [leadTimeDelay, setLeadTimeDelay] = useState(2);
  const [results, setResults] = useState(null);

  useEffect(() => {
    runSimulation();
  }, [demandMultiplier, leadTimeDelay]);

  const runSimulation = async () => {
    try {
      const res = await fetch('/api/simulation/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demand_surge_multiplier: demandMultiplier,
          lead_time_delay_days: leadTimeDelay
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.warn('Failed to run simulation:', e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-surface-900 to-surface-900 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white">
            Festive Surge & Supply Chain "What-If" Digital Twin
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Stress-test your business against Diwali/Dussehra sales surges and supplier transport delays before committing working capital.
        </p>
      </div>

      {/* Reactive Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Demand Multiplier */}
        <div className="p-5 rounded-2xl bg-surface-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Festive Demand Surge:
            </label>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {demandMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.5"
            value={demandMultiplier}
            onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1.0x (Normal)</span>
            <span>2.5x (Diwali Weekend)</span>
            <span>5.0x (Mega Flash Sale)</span>
          </div>
        </div>

        {/* Supplier Delay */}
        <div className="p-5 rounded-2xl bg-surface-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Logistics & Supplier Delay:
            </label>
            <span className="text-sm font-mono font-bold text-amber-400">
              +{leadTimeDelay} Days
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="14"
            step="1"
            value={leadTimeDelay}
            onChange={(e) => setLeadTimeDelay(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+0d (No Delay)</span>
            <span>+7d (Monsoon/Transport Strike)</span>
            <span>+14d (Severe Backlog)</span>
          </div>
        </div>
      </div>

      {/* Simulation Result Summary */}
      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-900/80 border border-rose-900/50">
            <span className="text-[11px] text-slate-400 block">Products at Stockout Risk</span>
            <span className="text-xl font-mono font-bold text-rose-400">
              {results.skus_at_risk ?? 4} / {results.total_skus ?? 8} SKUs
            </span>
          </div>
          <div className="p-4 rounded-xl bg-surface-900/80 border border-brand-900/50">
            <span className="text-[11px] text-slate-400 block">Required Capital Buffer</span>
            <span className="text-xl font-mono font-bold text-brand-400">
              ₹{Number(results.required_capital_buffer || 45000).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-surface-900/80 border border-emerald-900/50">
            <span className="text-[11px] text-slate-400 block">Estimated Festive Revenue</span>
            <span className="text-xl font-mono font-bold text-emerald-400">
              ₹{Number(results.estimated_festive_revenue || 128000).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
