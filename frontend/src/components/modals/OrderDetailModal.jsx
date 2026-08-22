import React, { useState } from 'react';
import {
  ShoppingBag,
  X,
  MessageSquare,
  CheckCircle,
  Truck,
  Check,
  Ban,
  Clock,
  QrCode
} from 'lucide-react';

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onStatusUpdated,
  onOpenWhatsApp,
  showToast
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !order) return null;

  const handleUpdateStatus = async (newStatus, paymentStatus = null) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, payment_status: paymentStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order Updated! 📦', `Order #${order.id} status changed to '${newStatus}'.`, 'success');
        if (onStatusUpdated) onStatusUpdated();
        onClose();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const isPaid = order.payment_status === 'Paid';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-surface-950 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Order #{order.id}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {order.status || 'Confirmed'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Customer: {order.customer_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Customer & Channel Info */}
          <div className="p-3.5 rounded-xl bg-surface-950 border border-slate-800 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Customer Name</span>
              <strong className="text-white text-xs">{order.customer_name}</strong>
              <span className="text-[11px] text-slate-400 block mt-0.5">{order.customer_phone || '+91 98765 43210'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Channel / Ingestion</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mt-1">
                <MessageSquare className="w-3 h-3" />
                {order.channel || 'WhatsApp'}
              </span>
            </div>
          </div>

          {/* Items & Financials */}
          <div className="p-3.5 rounded-xl bg-surface-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Items Ordered:</span>
              <span className="text-white font-medium text-right">{order.items_summary || 'Standard Order'}</span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>Total Bill Amount:</span>
              <strong className="text-white text-base font-mono font-bold">
                ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Payment Status:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                  isPaid
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {order.payment_status || 'Pending'}
              </span>
            </div>
          </div>

          {/* Quick UPI Link */}
          <div className="p-3.5 rounded-xl bg-brand-950/30 border border-brand-500/30 space-y-1.5">
            <span className="text-[10px] font-mono text-brand-300 font-bold block">
              📱 Instant UPI Settlement Deep Link:
            </span>
            <code className="text-[10px] text-slate-300 bg-surface-950 px-2.5 py-1.5 rounded block font-mono break-all border border-slate-800">
              upi://pay?pa=bizpilot@icici&am={order.total_amount}&tn={order.id}
            </code>
          </div>

          {/* Status Update Action Controls */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Order Status Transitions:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('Processing')}
                disabled={isUpdating || order.status === 'Processing'}
                className="p-2 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition cursor-pointer disabled:opacity-40"
              >
                Processing
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Dispatched')}
                disabled={isUpdating || order.status === 'Dispatched'}
                className="p-2 rounded-xl bg-surface-950 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500/40 text-blue-300 text-[11px] font-medium transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Truck className="w-3 h-3" /> Dispatched
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Delivered', 'Paid')}
                disabled={isUpdating || order.status === 'Delivered'}
                className="p-2 rounded-xl bg-surface-950 hover:bg-emerald-600/30 border border-slate-700 hover:border-emerald-500/40 text-emerald-300 text-[11px] font-medium transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Check className="w-3 h-3" /> Delivered
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('Cancelled')}
                disabled={isUpdating || order.status === 'Cancelled'}
                className="p-2 rounded-xl bg-surface-950 hover:bg-rose-600/30 border border-slate-700 hover:border-rose-500/40 text-rose-300 text-[11px] font-medium transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Ban className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenWhatsApp) onOpenWhatsApp();
              }}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Customer Chat</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-1.5 rounded-xl text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
