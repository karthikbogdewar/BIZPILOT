import React from 'react';
import {
  ShoppingBag,
  Clock,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Check,
  ChevronRight
} from 'lucide-react';

export default function DashboardTab({
  dashboard,
  onSwitchTab,
  onApprove,
  onReject
}) {
  if (!dashboard) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        Loading operational intelligence...
      </div>
    );
  }

  const { stats, priority, daily_summary, recent_logs } = dashboard;

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.total_orders ?? 0,
      icon: ShoppingBag,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20'
    },
    {
      title: 'Pending Fulfillment',
      value: stats?.pending_orders ?? 0,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Low Stock Risks',
      value: stats?.low_stock_count ?? 0,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'Khata Outstanding',
      value: `₹${(stats?.outstanding_payments || 0).toLocaleString('en-IN')}`,
      icon: CreditCard,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      title: "Today's Revenue",
      value: `₹${(stats?.today_revenue || 0).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Auto-Handled Tasks',
      value: stats?.auto_completed_tasks ?? 0,
      icon: CheckCircle2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${card.bg} bg-surface-900/80 backdrop-blur transition hover:border-slate-700 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium truncate">{card.title}</span>
                <Icon className={`w-4 h-4 shrink-0 ${card.color}`} />
              </div>
              <div className="text-xl font-bold font-mono text-white tracking-tight">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Column Daily Operations Triage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: 🔴 Urgent Action Items */}
        <div className="p-5 rounded-2xl bg-surface-900/70 border border-rose-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <h3 className="font-bold text-sm text-white">Critical & Urgent Risks</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {priority?.urgent?.length ?? 0} Items
            </span>
          </div>

          <div className="space-y-2.5">
            {priority?.urgent?.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500/60" />
                No critical risks detected.
              </div>
            ) : (
              priority?.urgent?.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface-950/80 border border-rose-900/50 hover:border-rose-700 transition flex flex-col justify-between gap-2"
                >
                  <div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-1">
                      {item.type === 'stockout_risk' ? 'STOCKOUT IMMINENT' : 'PAYMENT OVERDUE'}
                    </span>
                    <h4 className="font-bold text-white text-xs">{item.title}</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{item.detail}</p>
                  </div>
                  <div className="flex items-center justify-end pt-1">
                    <button
                      onClick={() => onSwitchTab('approvals')}
                      className="bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>{item.action_label}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: 🟡 Needs Owner Approval */}
        <div className="p-5 rounded-2xl bg-surface-900/70 border border-amber-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 className="font-bold text-sm text-white">Pending Owner Approvals</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {priority?.needs_approval?.length ?? 0} Pending
            </span>
          </div>

          <div className="space-y-2.5">
            {priority?.needs_approval?.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500/60" />
                All pending approvals resolved.
              </div>
            ) : (
              priority?.needs_approval?.map((app, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface-950/80 border border-amber-900/50 hover:border-amber-700 transition flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {app.type}
                      </span>
                      {app.amount && (
                        <span className="text-xs font-mono font-bold text-white">
                          ₹{app.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-xs">{app.title}</h4>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{app.recommendation}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => onReject(app.id)}
                      className="text-slate-400 hover:text-rose-400 text-[11px] px-2 py-1 rounded transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onApprove(app.id)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold px-3 py-1 rounded-lg transition shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: 🟢 Automatically Handled Tasks */}
        <div className="p-5 rounded-2xl bg-surface-900/70 border border-emerald-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="font-bold text-sm text-white">Autonomously Handled</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {priority?.auto_handled?.length ?? 0} Done
            </span>
          </div>

          <div className="space-y-2.5">
            {priority?.auto_handled?.slice(0, 4).map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-surface-950/60 border border-emerald-900/30 flex items-start gap-2.5"
              >
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <strong className="text-white font-medium truncate">{log.title}</strong>
                    <span className="text-slate-500 text-[10px] font-mono">{log.time_display}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{log.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Daily Summary & Mini Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily Summary & Recommendation */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-surface-900/90 to-surface-950 border border-slate-800 space-y-3">
          <h3 className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider">
            💡 Chief AI Operations Brief
          </h3>
          <div className="p-3.5 rounded-xl bg-brand-950/40 border border-brand-500/30 text-xs text-slate-200 leading-relaxed">
            {daily_summary?.highest_priority_recommendation || 'All daily operations running smoothly.'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Orders Processed</span>
              <strong className="text-white text-sm font-mono">{daily_summary?.orders_processed ?? 0}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Low Stock Risks</span>
              <strong className="text-rose-400 text-sm font-mono">{daily_summary?.low_stock_risks ?? 0}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Overdue Invoices</span>
              <strong className="text-amber-400 text-sm font-mono">{daily_summary?.overdue_payments ?? 0}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block">Tasks Automated</span>
              <strong className="text-emerald-400 text-sm font-mono">{daily_summary?.tasks_auto_completed ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* Live Mini Activity Stream */}
        <div className="p-5 rounded-2xl bg-surface-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-white">Live AI Activity Feed</h3>
            <button
              onClick={() => onSwitchTab('activity')}
              className="text-[11px] text-brand-400 hover:text-brand-300 font-medium cursor-pointer"
            >
              View All &rarr;
            </button>
          </div>
          <div className="space-y-2">
            {recent_logs?.slice(0, 4).map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      log.severity === 'urgent'
                        ? 'bg-rose-500'
                        : log.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-emerald-400'
                    }`}
                  ></span>
                  <span className="text-slate-200 truncate">{log.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{log.time_display}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
