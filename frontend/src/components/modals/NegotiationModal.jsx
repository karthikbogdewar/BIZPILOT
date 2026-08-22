import React, { useState, useEffect } from 'react';
import { Zap, Sparkles, CheckCircle2, X, ArrowRight } from 'lucide-react';

export default function NegotiationModal({ isOpen, onClose, supplier, showToast }) {
  const [targetQuantity, setTargetQuantity] = useState(25);
  const [paymentTerms, setPaymentTerms] = useState('Instant UPI Settlement');
  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (isOpen && supplier) {
      calculateNegotiation();
    }
  }, [isOpen, supplier]);

  const calculateNegotiation = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/procurement/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplier?.supplier_id || 'SUP-001',
          product_id: 'PRD-101',
          quoted_unit_price: supplier?.unit_price || 425.0,
          quantity: targetQuantity,
          payment_terms: paymentTerms
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      showToast('Negotiation Error', err.message, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-brand-500/50 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-brand-950/80 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Autonomous B2B Vendor Price Negotiation Engine
              </h3>
              <p className="text-[11px] text-slate-400">
                Calculates leverage points and drafts persuasive Hindi/English supplier counter-offers
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Negotiation Order Volume</label>
              <input
                type="number"
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(parseInt(e.target.value))}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Payment Leverage</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value="Instant UPI Settlement">100% Instant UPI Settlement (Max Leverage)</option>
                <option value="50% Advance + 50% on Delivery">50% Advance UPI</option>
                <option value="30-Day Credit">30-Day Credit</option>
              </select>
            </div>
          </div>

          <button
            onClick={calculateNegotiation}
            disabled={isCalculating}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-500/20"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Recalculate Optimal Counter-Offer</span>
          </button>

          {result && (
            <div className="p-4 rounded-xl bg-surface-950 border border-brand-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Quoted: ₹{result.quoted_unit_price}</span>
                <ArrowRight className="w-4 h-4 text-slate-600" />
                <span className="text-emerald-400 font-bold text-sm">
                  Counter-Offer: ₹{result.counter_unit_price} ({result.discount_percentage}% OFF)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block">AI Drafted Supplier Message:</span>
                <p className="text-slate-200 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {result.negotiation_script}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                <span>Net Margin Gain: <strong className="text-emerald-400">₹{result.estimated_margin_savings}</strong></span>
                <span className="text-brand-300">Strategy: {result.leverage_points?.[0]}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
