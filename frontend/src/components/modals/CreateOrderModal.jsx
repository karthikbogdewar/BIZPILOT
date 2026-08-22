import React, { useState } from 'react';
import { ShoppingBag, X, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function CreateOrderModal({
  isOpen,
  onClose,
  products = [],
  onOrderCreated,
  showToast
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 ');
  const [channel, setChannel] = useState('In-Store');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [selectedItems, setSelectedItems] = useState([
    { product_id: products[0]?.id || 'PRD-101', name: products[0]?.name || 'Boat BassHeads Earphones', qty: 1, price: products[0]?.unit_price || 499 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const defaultProd = products[0] || { id: 'PRD-101', name: 'Product', unit_price: 499 };
    setSelectedItems([
      ...selectedItems,
      { product_id: defaultProd.id, name: defaultProd.name, qty: 1, price: defaultProd.unit_price }
    ]);
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    if (field === 'product_id') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index] = {
          ...updated[index],
          product_id: prod.id,
          name: prod.name,
          price: prod.unit_price
        };
      }
    } else if (field === 'qty') {
      updated[index].qty = Math.max(1, parseInt(value) || 1);
    } else if (field === 'price') {
      updated[index].price = parseFloat(value) || 0;
    }
    setSelectedItems(updated);
  };

  const totalAmount = selectedItems.reduce(
    (acc, it) => acc + (it.price || 0) * (it.qty || 1),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast('Validation Error', 'Customer Name is required.', 'error');
      return;
    }
    if (selectedItems.length === 0) {
      showToast('Validation Error', 'Add at least one product item.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          channel: channel,
          payment_status: paymentStatus,
          status: 'Confirmed',
          items: selectedItems,
          total_amount: totalAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order Created! 🛒', `Order #${data.order_id} recorded for ₹${totalAmount.toLocaleString('en-IN')}.`, 'success');
        if (onOrderCreated) onOrderCreated();
        onClose();
      }
    } catch (err) {
      showToast('Order Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-brand-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-brand-950/80 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Create New Customer Order</h3>
              <p className="text-[11px] text-slate-400">Manual counter & in-store billing entry</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Babu"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Sales Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value="In-Store">In-Store / Counter</option>
                <option value="WhatsApp">WhatsApp Inbound</option>
                <option value="Telegram">Telegram Channel</option>
                <option value="Phone Call">Phone / Telephonic</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium"
              >
                <option value="Paid">Instant Paid (UPI / Cash)</option>
                <option value="Pending">Khata / Credit (Pending)</option>
              </select>
            </div>
          </div>

          {/* Items Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">Order Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-brand-400 hover:text-brand-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            <div className="space-y-2">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-surface-950 border border-slate-800 flex items-center gap-2">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    className="flex-1 bg-surface-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs truncate"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    className="w-14 bg-surface-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs text-center font-mono font-bold"
                    placeholder="Qty"
                  />

                  <span className="font-mono text-slate-400 text-xs w-20 text-right">
                    ₹{(item.price * item.qty).toLocaleString('en-IN')}
                  </span>

                  {selectedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total & Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block">Grand Total:</span>
              <strong className="text-white text-base font-mono font-bold">
                ₹{totalAmount.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-brand-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Place Order</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
