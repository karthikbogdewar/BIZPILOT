import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  MessageSquare,
  Receipt,
  QrCode,
  CheckCircle,
  Clock,
  Send,
  Search,
  Plus,
  Filter,
  Eye,
  Truck,
  Check,
  Ban
} from 'lucide-react';
import CreateOrderModal from '../modals/CreateOrderModal';
import OrderDetailModal from '../modals/OrderDetailModal';

export default function OrdersTab({
  orders = [],
  products = [],
  onOpenWhatsApp,
  onOrdersUpdated,
  initialFilter = null,
  showToast
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'All');
  const [paymentFilter, setPaymentFilter] = useState('All');

  useEffect(() => {
    if (initialFilter) {
      if (['Paid', 'Pending'].includes(initialFilter)) {
        setPaymentFilter(initialFilter);
        setStatusFilter('All');
      } else {
        setStatusFilter(initialFilter);
      }
    }
  }, [initialFilter]);

  const orderList = orders || [];

  const statuses = [
    'All',
    'Confirmed',
    'Processing',
    'Dispatched',
    'Delivered',
    'Cancelled'
  ];

  const filteredOrders = orderList.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items_summary?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      order.status?.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'Pending' && order.payment_status === 'Pending');

    const matchesPayment =
      paymentFilter === 'All' ||
      order.payment_status?.toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

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
            Auto-captured from natural language WhatsApp & Telegram conversations across Indic languages.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Order</span>
          </button>
          <button
            onClick={onOpenWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Simulate WhatsApp Order</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-900/80 p-3 rounded-2xl border border-slate-800">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 md:pb-0">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-medium transition shrink-0 cursor-pointer ${
                statusFilter === st
                  ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20'
                  : 'bg-surface-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search & Payment Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, ID, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-surface-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
          >
            <option value="All">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending (Khata)</option>
          </select>
        </div>
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
                <th className="p-3.5">Items Summary</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Payment</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No orders matching the current filter or search query.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    <td className="p-3.5 font-mono font-bold text-brand-400 group-hover:text-brand-300">
                      {order.id}
                    </td>
                    <td className="p-3.5">
                      <strong className="text-white block group-hover:text-slate-200">{order.customer_name}</strong>
                      <span className="text-[11px] text-slate-400">{order.customer_phone || '+91 98765 43210'}</span>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenWhatsApp) onOpenWhatsApp();
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition cursor-pointer"
                        title="Click to chat with customer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {order.channel || 'WhatsApp'}
                      </button>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 border border-brand-500/30 text-xs px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        products={products}
        onOrderCreated={onOrdersUpdated}
        showToast={showToast}
      />

      {/* Order Detail & Action Modal */}
      <OrderDetailModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onStatusUpdated={onOrdersUpdated}
        onOpenWhatsApp={onOpenWhatsApp}
        showToast={showToast}
      />
    </div>
  );
}
