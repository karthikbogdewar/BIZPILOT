import React, { useState, useEffect } from 'react';
import {
  Receipt,
  AlertCircle,
  CheckCircle,
  Send,
  CreditCard,
  QrCode,
  Search,
  Check,
  Eye,
  X
} from 'lucide-react';

export default function InvoicesKhataTab({
  invoices = [],
  onOpenKhataModal,
  onInvoicesUpdated,
  initialFilter = null,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'All');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter === 'overdue' ? 'Overdue' : initialFilter);
    }
  }, [initialFilter]);

  const invoiceList = invoices || [];

  const handleSimulatePayment = async (invId, e) => {
    if (e) e.stopPropagation();
    setIsSettling(true);
    try {
      const res = await fetch(`/api/invoices/${invId}/pay-simulate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (showToast) {
          showToast('Payment Settled! 💰', data.message, 'success');
        }
        if (onInvoicesUpdated) onInvoicesUpdated();
      }
    } catch (err) {
      if (showToast) {
        showToast('Payment Error', err.message, 'error');
      }
    } finally {
      setIsSettling(false);
    }
  };

  const filterTabs = ['All', 'Overdue', 'Pending', 'Paid'];

  const filteredInvoices = invoiceList.filter((inv) => {
    const isOverdue = inv.status === 'Overdue' || (inv.days_overdue && inv.days_overdue > 0);

    const matchesSearch =
      !searchQuery ||
      inv.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (statusFilter === 'Overdue') {
      matchesFilter = isOverdue && inv.status !== 'Paid';
    } else if (statusFilter === 'Pending') {
      matchesFilter = inv.status === 'Pending' && !isOverdue;
    } else if (statusFilter === 'Paid') {
      matchesFilter = inv.status === 'Paid';
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-400" />
            Invoices & Customer Khata (Udhar) Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated accounts receivable tracking with 3-tone escalation reminders across Indic languages with deep UPI links.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-medium transition shrink-0 cursor-pointer ${
                statusFilter === tab
                  ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20'
                  : 'bg-surface-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-surface-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-full md:w-64"
          />
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="rounded-2xl bg-surface-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3.5">Invoice ID</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Aging Overdue</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 text-right">Khata Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No invoices matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isOverdue = inv.status === 'Overdue' || (inv.days_overdue && inv.days_overdue > 0 && inv.status !== 'Paid');
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`hover:bg-slate-800/40 transition cursor-pointer group ${
                        isOverdue ? 'bg-amber-950/15' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-brand-400 group-hover:text-brand-300">
                        {inv.id}
                      </td>
                      <td className="p-3.5">
                        <strong className="text-white block">{inv.customer_name}</strong>
                        <span className="text-[11px] text-slate-400">{inv.customer_phone || '+91 98765 43210'}</span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white">
                        ₹{Number(inv.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {inv.due_date || '2026-08-20'}
                      </td>
                      <td className="p-3.5 font-mono">
                        {isOverdue ? (
                          <span className="text-amber-400 font-bold">
                            {inv.days_overdue || 3} days overdue
                          </span>
                        ) : inv.status === 'Paid' ? (
                          <span className="text-emerald-400">Settled</span>
                        ) : (
                          <span className="text-slate-400">On Schedule</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : isOverdue
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== 'Paid' ? (
                            <>
                              <button
                                onClick={(e) => handleSimulatePayment(inv.id, e)}
                                disabled={isSettling}
                                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1 cursor-pointer"
                                title="Mark settled via UPI"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark Paid</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenKhataModal(inv);
                                }}
                                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Send className="w-3 h-3 text-amber-400" />
                                <span>Reminder</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-emerald-400 text-xs flex items-center gap-1 justify-end font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Settled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Invoice #{selectedInvoice.id}</h3>
                <span className="text-[11px] text-slate-400">Customer: {selectedInvoice.customer_name}</span>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Customer Phone:</span>
                <span className="text-white font-medium">{selectedInvoice.customer_phone || '+91 98765 43210'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Due Date:</span>
                <span className="text-white font-mono">{selectedInvoice.due_date}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Total Amount:</span>
                <strong className="text-white font-mono text-base">
                  ₹{Number(selectedInvoice.amount || 0).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-brand-950/40 border border-brand-500/30 space-y-1.5 text-center text-xs">
              <span className="text-[11px] text-brand-300 font-mono font-bold block">
                📱 Instant UPI Deep Link:
              </span>
              <code className="text-[10px] text-slate-300 bg-surface-950 p-2 rounded block font-mono break-all border border-slate-800">
                upi://pay?pa=bizpilot@icici&am={selectedInvoice.amount}&tn={selectedInvoice.id}
              </code>
            </div>

            <div className="flex items-center justify-between pt-2">
              {selectedInvoice.status !== 'Paid' && (
                <button
                  onClick={() => {
                    handleSimulatePayment(selectedInvoice.id);
                    setSelectedInvoice(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Settle UPI Payment</span>
                </button>
              )}
              <button
                onClick={() => setSelectedInvoice(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
