import React, { useState, useEffect, useRef } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import DashboardTab from './components/tabs/DashboardTab';
import AgentsSquadTab from './components/tabs/AgentsSquadTab';
import AiAgentTab from './components/tabs/AiAgentTab';
import OrdersTab from './components/tabs/OrdersTab';
import InventoryTab from './components/tabs/InventoryTab';
import InvoicesKhataTab from './components/tabs/InvoicesKhataTab';
import SuppliersTab from './components/tabs/SuppliersTab';
import ApprovalsTab from './components/tabs/ApprovalsTab';
import WhatIfTab from './components/tabs/WhatIfTab';
import ActivityTab from './components/tabs/ActivityTab';
import SettingsTab from './components/tabs/SettingsTab';

// Modals
import NightShiftModal from './components/modals/NightShiftModal';
import WhatsAppModal from './components/modals/WhatsAppModal';
import OcrBillModal from './components/modals/OcrBillModal';
import NegotiationModal from './components/modals/NegotiationModal';
import KhataReminderModal from './components/modals/KhataReminderModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [agents, setAgents] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Modals state
  const [isNightShiftOpen, setIsNightShiftOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isNegotiateOpen, setIsNegotiateOpen] = useState(false);
  const [negotiateSupplier, setNegotiateSupplier] = useState(null);
  const [isKhataOpen, setIsKhataOpen] = useState(false);
  const [khataInvoice, setKhataInvoice] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  // Speech / Voice AI
  const [isListening, setIsListening] = useState(false);
  const voiceRecognitionRef = useRef(null);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (title, message, type = 'info') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchDashboardData(true),
        fetchProducts(),
        fetchOrders(),
        fetchInvoices(),
        fetchSuppliers(),
        fetchApprovals(),
        fetchAgents()
      ]);
    } catch (e) {
      console.warn('Error loading initial data:', e);
    }
  };

  const fetchDashboardData = async (showLoading = false) => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (e) {
      console.warn('Failed to load dashboard:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) setOrders(await res.json());
    } catch (e) {}
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) setInvoices(await res.json());
    } catch (e) {}
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) setSuppliers(await res.json());
    } catch (e) {}
  };

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals');
      if (res.ok) setApprovals(await res.json());
    } catch (e) {}
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (e) {}
  };

  // Human-in-the-Loop Actions
  const handleApprove = async (approvalId) => {
    try {
      const res = await fetch(`/api/approvals/${approvalId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Approval Confirmed! ✅', `${data.message} Status synced with Telegram.`, 'success');
        fetchAllData();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleReject = async (approvalId) => {
    try {
      const res = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by Business Owner from Web Dashboard' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Action Cancelled ❌', data.message, 'info');
        fetchAllData();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleRunDemo = async () => {
    showToast('Executing Demo Sequence... ⚡', 'Detecting stockout & preparing ₹8,500 PO...', 'info');
    try {
      const res = await fetch('/api/demo/hackathon-scenario', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Stockout Detected! 🚨', `${data.product} runout in ${data.days_remaining}d. Reorder prepared in Approvals Queue!`, 'success');
        await fetchAllData();
        setActiveTab('approvals');
      }
    } catch (err) {
      showToast('Demo Error', err.message, 'error');
    }
  };

  const handleSendTelegramBrief = async () => {
    try {
      const res = await fetch('/api/telegram/dispatch-daily-briefing', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Telegram Brief Sent! 📱', 'CEO summary dispatched to your connected Telegram bot (@KBNSN_bot).', 'success');
      } else {
        showToast('Telegram Status', data.message || 'Briefing recorded.', 'info');
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Voice AI
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice Error', 'Browser Speech Recognition not supported in this browser.', 'error');
      return;
    }

    if (isListening) {
      if (voiceRecognitionRef.current) voiceRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = currentLanguage === 'te' ? 'te-IN' : currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Voice AI Listening 🎙️', `Speak now in ${currentLanguage.toUpperCase()}...`, 'info');
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        showToast('Voice Captured', `"${transcript}"`, 'success');
        setIsListening(false);

        // Send to backend
        try {
          const res = await fetch('/api/ai/voice-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, language: currentLanguage })
          });
          const data = await res.json();
          setActiveTab('ai-agent');
          if ('speechSynthesis' in window && data.voice_script) {
            const clean = data.voice_script.replace(/[*#_`]/g, '');
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
          }
        } catch (err) {
          showToast('Voice Query Error', err.message, 'error');
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      voiceRecognitionRef.current = recognition;
      recognition.start();
    }
  };

  const pendingApprovalsCount = dashboard?.priority?.needs_approval?.length ?? 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSwitchTab={setActiveTab}
        stats={dashboard?.stats}
        pendingApprovalsCount={pendingApprovalsCount}
        onRunDemo={handleRunDemo}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Header
          activeTab={activeTab}
          profile={dashboard?.profile}
          pendingApprovalsCount={pendingApprovalsCount}
          currentLanguage={currentLanguage}
          setLanguage={setCurrentLanguage}
          isListening={isListening}
          toggleVoice={toggleVoice}
          onOpenNightShift={() => setIsNightShiftOpen(true)}
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
          onRunDemo={handleRunDemo}
          onSwitchTab={setActiveTab}
          onSendTelegramBrief={handleSendTelegramBrief}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto bg-surface-950">
          {activeTab === 'dashboard' && (
            <DashboardTab
              dashboard={dashboard}
              onSwitchTab={setActiveTab}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}

          {activeTab === 'agents-squad' && (
            <AgentsSquadTab agents={agents} />
          )}

          {activeTab === 'ai-agent' && (
            <AiAgentTab dashboard={dashboard} onSwitchTab={setActiveTab} showToast={showToast} />
          )}

          {activeTab === 'orders' && (
            <OrdersTab orders={orders} onOpenWhatsApp={() => setIsWhatsAppOpen(true)} />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              products={products}
              onOpenOcr={() => setIsOcrOpen(true)}
              onCompareSupplier={(pid) => setActiveTab('suppliers')}
              showToast={showToast}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesKhataTab
              invoices={invoices}
              onOpenKhataModal={(inv) => {
                setKhataInvoice(inv);
                setIsKhataOpen(true);
              }}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersTab
              suppliers={suppliers}
              products={products}
              onOpenNegotiate={(s) => {
                setNegotiateSupplier(s);
                setIsNegotiateOpen(true);
              }}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsTab
              approvals={approvals}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}

          {activeTab === 'what-if' && <WhatIfTab />}

          {activeTab === 'activity' && <ActivityTab activityLogs={dashboard?.recent_logs} />}

          {activeTab === 'settings' && (
            <SettingsTab
              profile={dashboard?.profile}
              onSaveSettings={fetchAllData}
              onResetDemo={async () => {
                await fetch('/api/demo/reset', { method: 'POST' });
                showToast('Reset Complete', 'Database restored to clean demo state.', 'success');
                fetchAllData();
              }}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <NightShiftModal
        isOpen={isNightShiftOpen}
        onClose={() => setIsNightShiftOpen(false)}
        showToast={showToast}
      />

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        onOrderCreated={fetchAllData}
        showToast={showToast}
      />

      <OcrBillModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onBillCommitted={fetchAllData}
        showToast={showToast}
      />

      <NegotiationModal
        isOpen={isNegotiateOpen}
        onClose={() => setIsNegotiateOpen(false)}
        supplier={negotiateSupplier}
        showToast={showToast}
      />

      <KhataReminderModal
        isOpen={isKhataOpen}
        onClose={() => setIsKhataOpen(false)}
        invoice={khataInvoice}
        showToast={showToast}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-surface-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-md animate-bounce">
          <div className="text-xs">
            <h5 className="font-bold text-white">{toast.title}</h5>
            <p className="text-slate-300 text-[11px] mt-0.5">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
