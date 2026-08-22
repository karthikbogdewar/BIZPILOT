import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Camera,
  Truck,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export default function InventoryTab({
  products,
  onOpenOcr,
  onCompareSupplier,
  showToast
}) {
  const [branchData, setBranchData] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    fetchBranchData();
  }, []);

  const fetchBranchData = async () => {
    try {
      const res = await fetch('/api/inventory/multi-branch');
      if (res.ok) {
        const data = await res.json();
        setBranchData(data);
      }
    } catch (e) {
      console.warn('Failed to load branch data:', e);
    }
  };

  const handleExecuteTransfer = async (transfer) => {
    setIsTransferring(true);
    try {
      const res = await fetch('/api/inventory/rebalance-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_branch: transfer.from_branch,
          to_branch: transfer.to_branch,
          product_id: transfer.product_id,
          quantity: transfer.quantity
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Inter-Store Transfer Dispatched! 🚀', `Porter driver assigned: ${data.transfer_details.delivery_partner}. Gate Pass: ${data.transfer_details.gate_pass_id}`, 'success');
        fetchBranchData();
      }
    } catch (err) {
      showToast('Transfer Error', err.message, 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const productList = products || [];

  return (
    <div className="p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Boxes className="w-4 h-4 text-brand-400" />
            Inventory & Stockout Prediction Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculates remaining stock runout days against supplier lead times using mathematical safety buffers.
          </p>
        </div>
        <button
          onClick={onOpenOcr}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>📸 Scan Handwritten Bill / Chitti</span>
        </button>
      </div>

      {/* Multi-Branch Stock Rebalancing Card */}
      {branchData && branchData.transfer_recommendations && branchData.transfer_recommendations.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-surface-900 to-surface-900 border border-purple-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-bold text-white text-xs">
                  🏬 Multi-Branch Stock Rebalancing ("Inter-Store Teleportation")
                </h3>
                <p className="text-[11px] text-slate-400">
                  Instant stock rebalancing across Indiranagar, Jayanagar & Whitefield outlets.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30">
              ₹8,320 Capital Saved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {branchData.transfer_recommendations.map((transfer, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-surface-950/80 border border-slate-800 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <strong className="text-white">{transfer.product_name}</strong>
                    <span className="font-mono text-emerald-400 font-bold text-[11px]">
                      {transfer.quantity} units
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                    <span className="text-rose-400">{transfer.from_branch}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="text-emerald-400">{transfer.to_branch}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{transfer.reason}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-mono">
                    Cost: <strong className="text-white">₹180 (Porter)</strong> vs ₹8,500 PO
                  </div>
                  <button
                    onClick={() => handleExecuteTransfer(transfer)}
                    disabled={isTransferring}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg transition shadow-md shadow-purple-600/30 flex items-center gap-1 cursor-pointer"
                  >
                    <span>🚀 Execute Transfer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stockout Prediction Table */}
      <div className="rounded-2xl bg-surface-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3.5">Product SKU</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Daily Velocity</th>
                <th className="p-3.5">Days to Runout</th>
                <th className="p-3.5">Supplier Lead Time</th>
                <th className="p-3.5">Unit Price</th>
                <th className="p-3.5">Risk Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {productList.map((p) => {
                const days = p.days_remaining;
                const isCritical = days <= p.lead_time_days;
                const isWarning = p.stock <= p.min_stock;

                let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                let statusText = 'Optimal Stock';
                if (isCritical) {
                  badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
                  statusText = '🔴 Stockout Risk';
                } else if (isWarning) {
                  badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  statusText = '🟡 Reorder Soon';
                }

                return (
                  <tr key={p.id} className={`hover:bg-slate-800/40 transition ${isCritical ? 'bg-rose-950/15' : ''}`}>
                    <td className="p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-950 border border-slate-700 flex items-center justify-center font-bold text-brand-400 font-mono text-xs shrink-0">
                        {p.id.replace('PRD-', '#')}
                      </div>
                      <div>
                        <strong className="text-white block font-semibold">{p.name}</strong>
                        <span className="text-[11px] text-slate-400">{p.category} | Buffer: {p.min_stock} units</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      {p.stock} units
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {p.avg_daily_sales} / day
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className={`font-bold ${isCritical ? 'text-rose-400' : (isWarning ? 'text-amber-400' : 'text-emerald-400')}`}>
                        {days} days
                      </span>
                      <div className="w-16 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full ${isCritical ? 'bg-rose-500' : (isWarning ? 'bg-amber-400' : 'bg-emerald-400')}`}
                          style={{ width: `${Math.min(100, (days / 10) * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {p.lead_time_days} days
                    </td>
                    <td className="p-3.5 font-mono text-slate-200">
                      ₹{p.unit_price.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onCompareSupplier(p.id)}
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
