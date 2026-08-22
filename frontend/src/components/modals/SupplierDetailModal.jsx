import React from 'react';
import {
  Truck,
  X,
  Zap,
  Award,
  Clock,
  ShieldCheck,
  CreditCard,
  Boxes,
  Phone,
  MapPin
} from 'lucide-react';

export default function SupplierDetailModal({
  isOpen,
  onClose,
  supplier,
  onOpenNegotiate
}) {
  if (!isOpen || !supplier) return null;

  const reliability = Math.round((supplier.reliability_score || 0.95) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-surface-950 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">{supplier.name || supplier.supplier_name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {supplier.id || supplier.supplier_id || 'SUP-001'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Wholesale Verified B2B Vendor</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Key Scorecard */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-surface-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Reliability Score</span>
              <strong className="text-brand-400 text-sm font-mono font-bold">{reliability}%</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Lead Time</span>
              <strong className="text-white text-sm font-mono font-bold">{supplier.lead_time_days || 3} Days</strong>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Credit Terms</span>
              <strong className="text-emerald-400 text-sm font-mono font-bold">{supplier.credit_days || 15} Days</strong>
            </div>
          </div>

          {/* Supplier Info Details */}
          <div className="p-3.5 rounded-xl bg-surface-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Location / Hub:
              </span>
              <span className="font-medium text-white">{supplier.city || 'Koti Wholesale Market, Hyderabad'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> Vendor Rep:
              </span>
              <span className="font-medium text-white">{supplier.contact || '+91 94401 23456 (Venkat Rao)'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" /> Min Order Qty (MOQ):
              </span>
              <span className="font-mono text-white font-bold">{supplier.moq || 10} Units</span>
            </div>
          </div>

          {/* Products Catalog Supplied */}
          {supplier.catalog && supplier.catalog.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Catalog Offerings:
              </span>
              <div className="space-y-1.5">
                {supplier.catalog.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-surface-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-white block">{item.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        MOQ: {item.moq} • Lead: {item.lead_time_days}d
                      </span>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      ₹{item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                if (onOpenNegotiate) onOpenNegotiate(supplier);
              }}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Autonomous Bargain</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
