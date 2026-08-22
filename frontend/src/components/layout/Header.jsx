import React from 'react';
import {
  Mic,
  Moon,
  MessageSquare,
  ShieldAlert,
  Zap,
  Send,
  Search,
  RotateCw,
  Menu,
  Sparkles
} from 'lucide-react';

export default function Header({
  activeTab,
  profile,
  pendingApprovalsCount,
  currentLanguage,
  setLanguage,
  isListening,
  toggleVoice,
  onOpenNightShift,
  onOpenWhatsApp,
  onRunDemo,
  onSwitchTab,
  onSendTelegramBrief,
  onOpenSearch,
  onTriggerScan,
  isScanning,
  onToggleMobileMenu
}) {
  const titleMap = {
    'dashboard': 'Operational Command Dashboard',
    'agents-squad': 'Autonomous AI Agents Squad (7 Active Workers)',
    'ai-agent': 'AI Agent Cognition & Command Center',
    'orders': 'Orders & WhatsApp Ingestion Channel',
    'inventory': 'Inventory & Stockout Prediction Engine',
    'invoices': 'Invoices & Customer Khata Ledger',
    'suppliers': 'Suppliers & Multi-Criteria Matrix',
    'approvals': 'Human-in-the-Loop Owner Approvals Queue',
    'what-if': 'Supply Chain & Festive Surge Digital Twin',
    'activity': 'Real-Time AI Activity & Audit Stream',
    'settings': 'Business Profile & Demo Settings'
  };

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिं' },
    { code: 'te', label: 'తె' },
    { code: 'kn', label: 'ಕ' },
    { code: 'ta', label: 'த' }
  ];

  return (
    <header className="bg-surface-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-5 py-2.5 h-14 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Left: Mobile Menu Toggle + Title & Store Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg bg-surface-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
          {titleMap[activeTab] || 'BizPilot AI'}
        </h1>

        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold truncate max-w-[150px]">
            {profile?.business_name || 'Sri Lakshmi Electronics'}
          </span>
        </div>
      </div>

      {/* Right: Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Global Search Bar / Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 bg-surface-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title="Global Search (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden md:inline text-[11px]">Search...</span>
          <kbd className="hidden lg:inline-block bg-slate-900 border border-slate-700 text-slate-500 text-[9px] px-1.5 py-0.2 rounded font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Scan Now Button */}
        <button
          onClick={onTriggerScan}
          disabled={isScanning}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
            isScanning
              ? 'bg-brand-600/30 text-brand-300 border-brand-500/40 animate-pulse'
              : 'bg-surface-950 hover:bg-brand-600/20 text-slate-300 hover:text-brand-300 border-slate-800'
          }`}
          title="Trigger full autonomous operations scan"
        >
          <RotateCw className={`w-3.5 h-3.5 text-brand-400 ${isScanning ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Scan Now'}</span>
        </button>

        {/* Language Switcher */}
        <div className="hidden sm:flex items-center bg-surface-950 border border-slate-800 rounded-lg p-0.5 text-[11px] font-semibold">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                currentLanguage === lang.code
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Voice AI */}
        <button
          onClick={toggleVoice}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border relative cursor-pointer ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
              : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30'
          }`}
          title="Speak to Voice AI in Telugu / Hindi / English"
        >
          <Mic className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden md:inline">{isListening ? 'Listening...' : 'Voice AI'}</span>
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </button>

        {/* 24h Autonomous Shift */}
        <button
          onClick={onOpenNightShift}
          className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          title="Simulate 24-Hour Autonomous Shift in 5 Seconds"
        >
          <Moon className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">24h Shift</span>
        </button>

        {/* WhatsApp Customer Chat Simulator */}
        <button
          onClick={onOpenWhatsApp}
          className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          title="Simulate Multilingual WhatsApp / Customer Orders"
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Chat</span>
        </button>

        {/* Telegram CEO Briefing */}
        <button
          onClick={onSendTelegramBrief}
          className="hidden 2xl:flex items-center gap-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
          title="Send Real-Time CEO Brief to Connected Telegram Bot"
        >
          <Send className="w-3.5 h-3.5 text-sky-400" />
          <span>Telegram</span>
        </button>

        {/* Approvals Badge */}
        <button
          onClick={() => onSwitchTab('approvals')}
          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          title="Owner Approvals Queue"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Approvals</span>
          <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
            {pendingApprovalsCount}
          </span>
        </button>

        {/* 1-Click Hero Demo */}
        <button
          onClick={onRunDemo}
          className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition cursor-pointer"
          title="Launch 1-Click Stockout & Vendor Negotiation Demo"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
          <span>Demo</span>
        </button>
      </div>
    </header>
  );
}
