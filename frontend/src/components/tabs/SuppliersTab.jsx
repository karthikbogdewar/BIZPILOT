import React, { useState, useEffect } from 'react';
import {
  Truck,
  Zap,
  TrendingDown,
  CheckCircle,
  Award,
  Sparkles,
  Search,
  Eye
} from 'lucide-react';
import SupplierDetailModal from '../modals/SupplierDetailModal';

export default function SuppliersTab({
  suppliers = [],
  onOpenNegotiate,
  selectedProduct = null,
  products = []
}) {
  const [currentPid, setCurrentPid] = useState(selectedProduct || 'PRD-101');
  const [comparison, setComparison] = useState(null);
  const [selectedSupplierForModal, setSelectedSupplierForModal] = useState(null);

  useEffect(() => {
    if (selectedProduct) {
      setCurrentPid(selectedProduct);
    }
  }, [selectedProduct]);

  useEffect(() => {
    fetchComparison(currentPid);
  }, [currentPid]);

  const fetchComparison = async (pid) => {
    try {
      const res = await fetch(`/api/suppliers/compare/${pid}`);
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (e) {
      console.warn('Failed to load supplier comparison:', e);
    }
  };

  const productList = products && products.length > 0 ? products : [
    { id: 'PRD-101', name: 'Boat BassHeads Earphones' },
    { id: 'PRD-102', name: '65W Fast GaN Charger' },
    { id: 'PRD-107', name: 'Redmi Note 13 5G Smartphone' },
    { id: 'PRD-108', name: 'Mi 20000mAh Power Bank' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top Action & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-400" />
            Suppliers & Multi-Criteria Evaluation Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time evaluation across Price, MOQ, Lead Time, Credit Terms & Historic Reliability.
          </p>
        </div>

        {/* Product SKU Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-surface-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-xs text-slate-400 font-mono">Evaluate SKU:</span>
          <select
            value={currentPid}
            onChange={(e) => setCurrentPid(e.target.value)}
            className="bg-surface-950 border border-slate-700 text-white text-xs px-3 py-1 rounded-lg font-medium focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            {productList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Optimal Recommendation Banner */}
      {comparison && comparison.best_choice && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-950/80 via-surface-900 to-surface-900 border border-brand-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-xs">
                AI Optimal Choice: {comparison.best_choice.supplier_name}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Selected for lowest total cost (₹{Number(comparison.best_choice.estimated_total_cost || 0).toLocaleString('en-IN')}) and {comparison.best_choice.lead_time_days}-day rapid delivery.
            </p>
          </div>

          <button
            onClick={() => onOpenNegotiate(comparison.best_choice)}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>⚡ Auto-Negotiate Price (Save 5%-12%)</span>
          </button>
        </div>
      )}

      {/* Supplier Comparison Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(comparison?.suppliers || suppliers || []).map((s, idx) => {
          const isBest = comparison?.best_choice?.supplier_id === (s.supplier_id || s.id);
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-surface-900/80 border transition flex flex-col justify-between space-y-3 ${
                isBest ? 'border-brand-500/80 shadow-lg shadow-brand-500/10' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white text-xs truncate">{s.supplier_name || s.name}</h4>
                  {isBest && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ★ TOP PICK
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Unit Price:</span>
                    <strong className="text-white font-mono">₹{s.unit_price || s.price}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lead Time:</span>
                    <span className="text-slate-200 font-mono">{s.lead_time_days} days</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Min Order (MOQ):</span>
                    <span className="text-slate-200 font-mono">{s.moq} units</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Credit Terms:</span>
                    <span className="text-emerald-400 font-mono">{s.credit_days || 15} days</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Reliability Score:</span>
                    <span className="text-brand-400 font-mono font-bold">{Math.round((s.reliability_score || 0.95) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => setSelectedSupplierForModal(s)}
                  className="p-1.5 rounded-lg bg-surface-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
                  title="Inspect Supplier Details"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenNegotiate(s)}
                  className="flex-1 bg-surface-950 hover:bg-brand-600/30 text-brand-300 hover:text-white border border-slate-800 hover:border-brand-500/40 text-xs font-semibold py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Negotiate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Detail Modal */}
      <SupplierDetailModal
        isOpen={!!selectedSupplierForModal}
        onClose={() => setSelectedSupplierForModal(null)}
        supplier={selectedSupplierForModal}
        onOpenNegotiate={onOpenNegotiate}
      />
    </div>
  );
}
