import React, { useState } from 'react';
import { Camera, CheckCircle2, Sparkles, X, Plus } from 'lucide-react';

export default function OcrBillModal({ isOpen, onClose, onBillCommitted, showToast }) {
  const [supplierName, setSupplierName] = useState('ABC Electronics Distributors (Hyderabad)');
  const [billText, setBillText] = useState(
    "ABC ELECTRONICS DISTRIBUTORS - KOTI HYDERABAD\nDelivery Challan / Cash Memo #5492\nDate: 23-Aug-2026\n----------------------------------------\n1. Boat BassHeads Earphones - 20 pcs @ 425/- = 8,500.00\n2. 65W GaN Fast Charger - 10 pcs @ 820/- = 8,200.00\n3. 100W Braided Type-C Cable - 25 pcs @ 180/- = 4,500.00\n4. Redmi Note 13 5G - 2 pcs @ 13,200/- = 26,400.00\n----------------------------------------\nSubtotal: Rs. 47,600.00\nCGST 9%: Rs. 4,284.00\nSGST 9%: Rs. 4,284.00\nTotal Bill: Rs. 56,168.00\nReceiver Sign: Sri Lakshmi Electronics"
  );
  const [parsedBill, setParsedBill] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessOcr = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ocr/digitize-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: billText,
          supplier_name: supplierName
        })
      });
      const data = await res.json();
      setParsedBill(data);
      showToast('Bill Digitized! ⚡', `Extracted ${data.line_items.length} line items with ₹${data.itc_eligible} ITC.`, 'info');
    } catch (err) {
      showToast('OCR Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitBill = async () => {
    if (!parsedBill) return;
    try {
      const res = await fetch('/api/ocr/commit-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bill_data: parsedBill })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Inventory Updated! 📦', `Added ${parsedBill.line_items.length} items to inventory. Recorded ₹${data.itc_claimed} ITC.`, 'success');
        if (onBillCommitted) onBillCommitted();
        onClose();
      }
    } catch (err) {
      showToast('Commit Error', err.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-indigo-500/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-950/80 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Physical "Kacha Parcha / Handwritten Bill" OCR Digitizer
              </h3>
              <p className="text-[11px] text-slate-400">
                Converts paper delivery challans into instant verified stock additions & GST ITC claims
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Wholesale Supplier Name</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Handwritten Bill / Challan Text Input</label>
            <textarea
              rows={5}
              value={billText}
              onChange={(e) => setBillText(e.target.value)}
              className="w-full bg-surface-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleProcessOcr}
            disabled={isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>⚡ Extract & Verify Line Items</span>
          </button>

          {/* Parsed Results Box */}
          {parsedBill && (
            <div className="p-4 rounded-xl bg-surface-950 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Extracted Line Items ({parsedBill.line_items?.length})</span>
                <span className="font-mono text-emerald-400 font-bold text-[11px]">
                  Total: ₹{Number(parsedBill.total_amount || 0).toLocaleString('en-IN')} (ITC: ₹{parsedBill.itc_eligible})
                </span>
              </div>

              <div className="space-y-1.5">
                {parsedBill.line_items?.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-surface-900 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <strong className="text-white block font-sans">{it.product_name}</strong>
                      <span className="text-[10px] text-slate-400">{it.matched_sku} | {it.quantity} units @ ₹{it.unit_cost}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">₹{Number(it.total_cost).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCommitBill}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Commit {parsedBill.line_items?.length} Items Directly to Live Inventory</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
