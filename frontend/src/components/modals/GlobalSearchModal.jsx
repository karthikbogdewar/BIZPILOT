import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ShoppingBag,
  Boxes,
  Receipt,
  Truck,
  Bot,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  products = [],
  orders = [],
  invoices = [],
  suppliers = [],
  agents = [],
  approvals = [],
  onNavigate
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search across entities
  const matchedProducts = q
    ? products.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedOrders = q
    ? orders.filter(
        (o) =>
          o.id?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.items_summary?.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedInvoices = q
    ? invoices.filter(
        (i) =>
          i.id?.toLowerCase().includes(q) ||
          i.customer_name?.toLowerCase().includes(q) ||
          i.status?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedSuppliers = q
    ? suppliers.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.supplier_name?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedApprovals = q
    ? approvals.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.id?.toLowerCase().includes(q) ||
          a.type?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const hasResults =
    matchedProducts.length > 0 ||
    matchedOrders.length > 0 ||
    matchedInvoices.length > 0 ||
    matchedSuppliers.length > 0 ||
    matchedApprovals.length > 0;

  const handleSelect = (tab, params = {}) => {
    onNavigate(tab, params);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-surface-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-surface-950/90">
          <Search className="w-5 h-5 text-brand-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search orders, products, invoices, suppliers, or approvals (e.g. 'Boat', 'INV-1002', 'Redmi')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block bg-slate-800 border border-slate-700 text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Search Results / Quick Links */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {!q ? (
            <div className="space-y-3 py-2">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleSelect('orders')}
                  className="p-3 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-brand-400" />
                  <span className="text-white font-medium">Orders</span>
                </button>
                <button
                  onClick={() => handleSelect('inventory')}
                  className="p-3 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer"
                >
                  <Boxes className="w-4 h-4 text-rose-400" />
                  <span className="text-white font-medium">Inventory</span>
                </button>
                <button
                  onClick={() => handleSelect('invoices')}
                  className="p-3 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer"
                >
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium">Invoices & Khata</span>
                </button>
                <button
                  onClick={() => handleSelect('suppliers')}
                  className="p-3 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-sky-400" />
                  <span className="text-white font-medium">Suppliers</span>
                </button>
                <button
                  onClick={() => handleSelect('approvals')}
                  className="p-3 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium">Approvals</span>
                </button>
                <button
                  onClick={() => handleSelect('agents-squad')}
                  className="p-3 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2.5 cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-medium">AI Agents</span>
                </button>
              </div>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No matching records found for "{query}". Try another keyword.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Products Results */}
              {matchedProducts.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-rose-400" /> Products ({matchedProducts.length})
                  </div>
                  {matchedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect('inventory', { selectedProduct: p.id })}
                      className="w-full p-2.5 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div>
                        <strong className="text-white block">{p.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.id} • Stock: {p.stock} units • ₹{p.unit_price}
                        </span>
                      </div>
                      <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Orders Results */}
              {matchedOrders.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-400" /> Orders ({matchedOrders.length})
                  </div>
                  {matchedOrders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => handleSelect('orders', { selectedOrder: o.id })}
                      className="w-full p-2.5 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div>
                        <strong className="text-white block">{o.id} - {o.customer_name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ₹{Number(o.total_amount || 0).toLocaleString('en-IN')} • {o.items_summary || 'Items'} • {o.status}
                        </span>
                      </div>
                      <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Invoices Results */}
              {matchedInvoices.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" /> Invoices & Khata ({matchedInvoices.length})
                  </div>
                  {matchedInvoices.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => handleSelect('invoices', { selectedInvoice: inv.id })}
                      className="w-full p-2.5 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div>
                        <strong className="text-white block">{inv.id} - {inv.customer_name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ₹{Number(inv.amount || 0).toLocaleString('en-IN')} • Status: {inv.status}
                        </span>
                      </div>
                      <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Suppliers Results */}
              {matchedSuppliers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-sky-400" /> Suppliers ({matchedSuppliers.length})
                  </div>
                  {matchedSuppliers.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect('suppliers', { selectedSupplier: s.id || s.supplier_id })}
                      className="w-full p-2.5 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div>
                        <strong className="text-white block">{s.name || s.supplier_name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Lead Time: {s.lead_time_days || 3}d • Reliability: {Math.round((s.reliability_score || 0.95) * 100)}%
                        </span>
                      </div>
                      <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Approvals Results */}
              {matchedApprovals.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Approvals ({matchedApprovals.length})
                  </div>
                  {matchedApprovals.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleSelect('approvals', { selectedApproval: app.id })}
                      className="w-full p-2.5 rounded-xl bg-surface-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div>
                        <strong className="text-white block">{app.title}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {app.id} • {app.type} • Status: {app.status}
                        </span>
                      </div>
                      <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
