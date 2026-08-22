import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Cpu,
  ShoppingBag,
  Boxes,
  Receipt,
  Truck,
  ShieldAlert,
  Sparkles,
  History,
  Settings,
  Play,
  X
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onSwitchTab,
  stats,
  pendingApprovalsCount,
  onRunDemo,
  isMobileOpen,
  onCloseMobile
}) {
  const navSections = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'agents-squad',
          label: 'AI Agents Squad',
          icon: Bot,
          badge: '7 Active',
          badgeColor: 'bg-brand-500/20 text-brand-300 border-brand-500/30'
        },
        {
          id: 'ai-agent',
          label: 'AI Command Center',
          icon: Cpu,
          isPulse: true
        },
        {
          id: 'orders',
          label: 'Orders & WhatsApp',
          icon: ShoppingBag,
          count: stats?.total_orders ?? 5
        },
        {
          id: 'inventory',
          label: 'Inventory & Stockout',
          icon: Boxes,
          badge: `${stats?.low_stock_count ?? 1} Risk`,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        }
      ]
    },
    {
      title: 'FINANCE & SUPPLY',
      items: [
        {
          id: 'invoices',
          label: 'Invoices & Khata',
          icon: Receipt,
          badge: '2 Overdue',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        },
        { id: 'suppliers', label: 'Suppliers & Matrix', icon: Truck },
        {
          id: 'approvals',
          label: 'Owner Approvals',
          icon: ShieldAlert,
          count: pendingApprovalsCount,
          isAlert: pendingApprovalsCount > 0
        }
      ]
    },
    {
      title: 'ANALYTICS & TOOLS',
      items: [
        {
          id: 'what-if',
          label: 'What-If Digital Twin',
          icon: Sparkles,
          badge: 'Simulator',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        },
        { id: 'activity', label: 'AI Activity Stream', icon: History },
        { id: 'settings', label: 'Business Settings', icon: Settings }
      ]
    }
  ];

  const handleTabClick = (tabId) => {
    onSwitchTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-60 bg-surface-900/95 border-r border-slate-800/80 flex flex-col justify-between h-screen shrink-0 overflow-y-auto transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/20 border border-brand-400/30">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  BizPilot AI
                  <span className="bg-brand-500/20 text-brand-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border border-brand-500/30">
                    Ops
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Autonomous Operations</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="p-2.5 space-y-4">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <div className="px-2 text-[10px] font-mono font-bold text-slate-500 tracking-wider">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer group ${
                        isActive
                          ? 'bg-brand-600/15 text-white font-semibold border-l-2 border-brand-500'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.isPulse && (
                        <span className="flex h-2 w-2 relative shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                      )}

                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border shrink-0 ${
                            item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {item.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono shrink-0 ${
                            item.isAlert
                              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* 1-Click Demo Card at Bottom of Sidebar */}
        <div className="p-3 m-2.5 rounded-xl bg-gradient-to-b from-slate-800/80 to-surface-950 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 mb-1 text-brand-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Hackathon Demo</span>
          </div>
          <p className="text-slate-400 text-[10px] mb-2 leading-relaxed">
            Replay stockout detection, vendor bargaining & PO approval.
          </p>
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onRunDemo();
            }}
            className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium py-1.5 px-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Launch Demo</span>
          </button>
        </div>
      </aside>
    </>
  );
}
