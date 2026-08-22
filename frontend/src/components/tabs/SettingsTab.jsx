import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, ShieldCheck } from 'lucide-react';

export default function SettingsTab({ profile, onSaveSettings, onResetDemo, showToast }) {
  const [formData, setFormData] = useState({
    business_name: 'Sri Lakshmi Electronics',
    owner_name: 'Karthik Sharma',
    category: 'Consumer Electronics & Mobile Accessories',
    city: 'Hyderabad, Telangana',
    auto_pilot_enabled: 1,
    approval_required_above: 5000.0
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || 'Sri Lakshmi Electronics',
        owner_name: profile.owner_name || 'Karthik Sharma',
        category: profile.category || 'Consumer Electronics',
        city: profile.city || 'Hyderabad',
        auto_pilot_enabled: profile.auto_pilot_enabled ?? 1,
        approval_required_above: profile.approval_required_above ?? 5000.0
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Settings Saved', 'Business profile and autopilot parameters updated.', 'success');
        if (onSaveSettings) onSaveSettings();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-400" />
          Business Profile & Autonomy Guardrails
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure business metadata, autopilot execution rules, and financial approval thresholds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-surface-900/80 border border-slate-800 space-y-5 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Store / Business Name</label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Business Owner Name</label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Category / Trade</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Operating City / Region</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-3">
          <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Financial Approval Guardrails
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">
                Require Owner Sign-Off for POs Above (₹)
              </label>
              <input
                type="number"
                value={formData.approval_required_above}
                onChange={(e) => setFormData({ ...formData, approval_required_above: parseFloat(e.target.value) })}
                className="w-full bg-surface-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onResetDemo}
            className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Database</span>
          </button>
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
