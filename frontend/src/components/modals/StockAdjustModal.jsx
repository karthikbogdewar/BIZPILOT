import React, { useState, useEffect } from 'react';
import { Boxes, X, Plus, Minus, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StockAdjustModal({
  isOpen,
  onClose,
  product,
  onStockUpdated,
  showToast
}) {
  const [stock, setStock] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (product) {
      setStock(product.stock || 0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const dailyVelocity = product.avg_daily_sales || 1.0;
  const newDaysRemaining = dailyVelocity > 0 ? (stock / dailyVelocity).toFixed(1) : 999;
  const isCritical = newDaysRemaining <= product.lead_time_days;
  const isWarning = stock <= product.min_stock;

  const handleAdjust = (delta) => {
    setStock((prev) => Math.max(0, prev + delta));
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_stock: stock })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Stock Updated! 📦', `${product.name} inventory set to ${stock} units (${newDaysRemaining} days buffer).`, 'success');
        if (onStockUpdated) onStockUpdated();
        onClose();
      }
    } catch (err) {
      showToast('Stock Error', err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-surface-950 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Quick Stock Level Adjustment</h3>
              <p className="text-[11px] text-slate-400">{product.name} ({product.id})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-surface-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Category / Buffer:</span>
            <span className="text-white font-medium">{product.category} • Min: {product.min_stock} units</span>
          </div>

          <div className="text-center space-y-2 py-2">
            <span className="text-slate-400 text-[11px] font-mono">Current In-Store Stock Units</span>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleAdjust(-10)}
                className="w-9 h-9 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer transition"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(-1)}
                className="w-9 h-9 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 bg-surface-950 border border-brand-500 rounded-xl px-2 py-2 text-center text-white text-xl font-mono font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAdjust(1)}
                className="w-9 h-9 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(10)}
                className="w-9 h-9 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer transition"
              >
                +10
              </button>
            </div>
          </div>

          {/* Recalculated Projections */}
          <div className="p-3.5 rounded-xl bg-surface-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">Sales Velocity:</span>
              <span className="text-white">{product.avg_daily_sales} units / day</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">Supplier Lead Time:</span>
              <span className="text-white">{product.lead_time_days} days</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400 font-sans">Predicted Runout:</span>
              <span
                className={`font-bold ${
                  isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {newDaysRemaining} days remaining
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-2 rounded-xl transition shadow-lg shadow-brand-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Stock</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
