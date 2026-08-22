import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function WhatIfTab({ onSwitchTab }) {
  const [demandMultiplier, setDemandMultiplier] = useState(2.5);
  const [leadTimeDelay, setLeadTimeDelay] = useState(3);
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

  const applyPreset = (mult, delay) => {
    setDemandMultiplier(mult);
    setLeadTimeDelay(delay);
  };

  const defaultSkus = [
    { id: 'PRD-101', name: 'Boat BassHeads Earphones', stock: 12, normal_velocity: 4.5, lead_time: 3 },
    { id: 'PRD-102', name: '65W Fast GaN Charger', stock: 24, normal_velocity: 3.2, lead_time: 2 },
    { id: 'PRD-107', name: 'Redmi Note 13 5G Smartphone', stock: 8, normal_velocity: 2.1, lead_time: 4 },
    { id: 'PRD-108', name: 'Mi 20000mAh Power Bank', stock: 15, normal_velocity: 2.8, lead_time: 3 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-surface-900 to-surface-900 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-white">
              Festive Surge & Supply Chain "What-If" Digital Twin
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Stress-test inventory buffers against festive demand surges and supplier logistics delays before committing working capital.
          </p>
        </div>

        {/* Quick Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset(2.5, 3)}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition cursor-pointer"
          >
            🪔 Diwali Surge (2.5x, +3d)
          </button>
          <button
            onClick={() => applyPreset(1.2, 7)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition cursor-pointer"
          >
            🌧️ Monsoon Delay (+7d)
          </button>
          <button
            onClick={() => applyPreset(3.5, 4)}
            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition cursor-pointer"
          >
            ⚡ Mega Flash Sale (3.5x)
          </button>
        </div>
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
            <span>+7d (Monsoon/Strike)</span>
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

      {/* Impacted SKU Stress Matrix Table */}
      <div className="rounded-2xl bg-surface-900/80 border border-slate-800 overflow-hidden space-y-2">
        <div className="p-4 bg-surface-950/80 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-xs">Simulated SKU Stock Depletion Timelines</h3>
          <span className="text-[11px] font-mono text-slate-400">
            Surge: {demandMultiplier}x • Lead Time: +{leadTimeDelay}d
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">Product SKU</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Surge Velocity</th>
                <th className="p-3.5">Effective Lead Time</th>
                <th className="p-3.5">Simulated Runout</th>
                <th className="p-3.5">Stress Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {defaultSkus.map((sku) => {
                const surgeVel = (sku.normal_velocity * demandMultiplier).toFixed(1);
                const effLead = sku.lead_time + leadTimeDelay;
                const simRunout = (sku.stock / (sku.normal_velocity * demandMultiplier)).toFixed(1);
                const isRisk = parseFloat(simRunout) <= effLead;

                return (
                  <tr key={sku.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3.5">
                      <strong className="text-white block">{sku.name}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">{sku.id}</span>
                    </td>
                    <td className="p-3.5 font-mono text-white font-bold">{sku.stock} units</td>
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{surgeVel} / day</td>
                    <td className="p-3.5 font-mono text-amber-400">{effLead} days</td>
                    <td className="p-3.5 font-mono">
                      <span className={`font-bold ${isRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {simRunout} days
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          isRisk
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {isRisk ? '🔴 Stockout in Surge' : '🟢 Safe Buffer'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          if (onSwitchTab) onSwitchTab('suppliers', { selectedProduct: sku.id });
                        }}
                        className="bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/30 text-xs px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                      >
                        Reorder Analysis
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
