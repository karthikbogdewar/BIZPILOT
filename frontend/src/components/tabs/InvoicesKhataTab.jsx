import React, { useState } from 'react';
import {
  Receipt,
  AlertCircle,
  CheckCircle,
  Send,
  CreditCard,
  QrCode
} from 'lucide-react';

export default function InvoicesKhataTab({
  invoices,
  onOpenKhataModal
}) {
  const invoiceList = invoices || [];

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
                <th className="p-3.5">Days Overdue</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 text-right">Khata Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoiceList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoiceList.map((inv) => {
                  const isOverdue = inv.status === 'Overdue' || (inv.days_overdue && inv.days_overdue > 0);
                  return (
                    <tr key={inv.id} className={`hover:bg-slate-800/40 transition ${isOverdue ? 'bg-amber-950/15' : ''}`}>
                      <td className="p-3.5 font-mono font-bold text-brand-400">
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
                        ) : (
                          <span className="text-emerald-400">On Schedule</span>
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
                        {inv.status !== 'Paid' ? (
                          <button
                            onClick={() => onOpenKhataModal(inv)}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Send className="w-3 h-3 text-amber-400" />
                            <span>Send Khata Reminder</span>
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs flex items-center gap-1 justify-end font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
