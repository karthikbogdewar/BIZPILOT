import React, { useState } from 'react';
import {
  ShoppingBag,
  MessageSquare,
  Receipt,
  QrCode,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';

export default function OrdersTab({ orders, onOpenWhatsApp }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orderList = orders || [];

  return (
    <div className="p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand-400" />
            Inbound Orders & Ingestion Channel
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-captured from natural language WhatsApp and Telegram conversations across Indic languages.
          </p>
        </div>
        <button
          onClick={onOpenWhatsApp}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Simulate Inbound Order</span>
        </button>
      </div>

      {/* Orders Table Card */}
      <div className="rounded-2xl bg-surface-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orderList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No orders recorded yet. Simulate an inbound order to see live ingestion.
                  </td>
                </tr>
              ) : (
                orderList.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-brand-400">
                      {order.id}
                    </td>
                    <td className="p-3.5">
                      <strong className="text-white block">{order.customer_name}</strong>
                      <span className="text-[11px] text-slate-400">{order.customer_phone || '+91 98765 43210'}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <MessageSquare className="w-3 h-3" />
                        {order.channel || 'WhatsApp'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-xs truncate">
                      {order.items_summary || 'Redmi Note 13 5G, 65W GaN Charger'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          order.payment_status === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {order.payment_status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {order.status || 'Confirmed'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/30 text-xs px-2.5 py-1 rounded-lg transition font-medium cursor-pointer"
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Popup */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Invoice #{selectedOrder.id}</h3>
                <span className="text-[11px] text-slate-400">Customer: {selectedOrder.customer_name}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items:</span>
                <span className="text-white font-medium">{selectedOrder.items_summary || 'Standard Order'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Bill Amount:</span>
                <span className="text-white font-bold font-mono text-sm">
                  ₹{Number(selectedOrder.total_amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Channel:</span>
                <span className="text-emerald-400 font-mono font-bold">UPI Auto-Settlement</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-500/30 text-center space-y-2">
              <span className="text-[11px] text-brand-300 font-mono block font-bold">
                📱 Instant UPI Deep Link:
              </span>
              <code className="text-[10px] text-slate-300 bg-surface-950 px-2 py-1 rounded block font-mono break-all">
                upi://pay?pa=bizpilot@icici&am={selectedOrder.total_amount}&tn={selectedOrder.id}
              </code>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
