import React, { useState } from 'react';
import {
  Bot,
  Activity,
  Zap,
  CheckCircle,
  Play,
  Layers,
  Sparkles,
  Search,
  Power,
  ChevronRight
} from 'lucide-react';
import AgentDetailModal from '../modals/AgentDetailModal';

export default function AgentsSquadTab({ agents, showToast }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [taskResult, setTaskResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const defaultAgents = [
    {
      id: 'agent_sentinel',
      name: 'Inventory Sentinel Agent',
      role: 'Demand Forecasting & Lead Time Calibrator',
      status: 'MONITORING',
      color: 'from-blue-600 to-indigo-600',
      description: 'Continuously evaluates runout days against supplier lead times using mathematical safety buffer equations.',
      tasks: [
        { name: 'forecast_stockout_risks', label: 'Scan Stockout Risks' },
        { name: 'evaluate_reorder_quantities', label: 'Calculate EOQ Reorders' }
      ]
    },
    {
      id: 'agent_procurement',
      name: 'Procurement Specialist Agent',
      role: 'Multi-Supplier Evaluation & PO Preparation',
      status: 'ACTIVE',
      color: 'from-amber-600 to-orange-600',
      description: 'Scores suppliers across Price, MOQ, Credit Terms, Reliability and Lead Time to optimize purchasing cost.',
      tasks: [
        { name: 'compare_suppliers', label: 'Run Supplier Matrix (PRD-101)' },
        { name: 'draft_purchase_order', label: 'Draft ₹8,500 PO' }
      ]
    },
    {
      id: 'agent_sales',
      name: 'Sales & Multilingual Ingestion Agent',
      role: 'WhatsApp/Telegram Natural Order Clerk',
      status: 'LISTENING',
      color: 'from-emerald-600 to-teal-600',
      description: 'Parses inbound Telugu, Hindi, Kannada, Tamil and English messages into validated database orders without hallucinations.',
      tasks: [
        { name: 'parse_and_fulfill_message', label: 'Test Inbound Order Parse' }
      ]
    },
    {
      id: 'agent_cashflow',
      name: 'Cash Flow & Khata Recovery Agent',
      role: 'Customer Udhar Ledger & UPI Generator',
      status: 'TRACKING',
      color: 'from-sky-600 to-cyan-600',
      description: 'Tracks accounts receivable and generates 3-tone multilingual payment recovery reminders with deep UPI links.',
      tasks: [
        { name: 'audit_unpaid_invoices', label: 'Audit Unpaid Receivables' },
        { name: 'generate_khata_reminders', label: 'Generate Recovery Reminders' }
      ]
    },
    {
      id: 'agent_negotiator',
      name: 'B2B Vendor Negotiation Agent',
      role: 'Autonomous Supplier Discount Bargainer',
      status: 'READY',
      color: 'from-rose-600 to-pink-600',
      description: 'Leverages order volume, past order history, and instant UPI settlement to negotiate 5%–12% supplier discounts.',
      tasks: [
        { name: 'calculate_negotiation_counter', label: 'Simulate ABC Vendor Bargain' }
      ]
    },
    {
      id: 'agent_multilingual',
      name: 'Indic Multilingual Translation Agent',
      role: '5-Language Conversational Localizer',
      status: 'SYNCHRONIZED',
      color: 'from-purple-600 to-violet-600',
      description: 'Generates warm, culturally authentic Indian store clerk phrasing across Telugu, Hindi, Kannada, Tamil & English.',
      tasks: [
        { name: 'test_telugu_reply', label: 'Format Telugu Store Reply' }
      ]
    },
    {
      id: 'agent_orchestrator',
      name: 'Chief Operations Orchestrator',
      role: 'Central Swarm Coordinator & CEO Briefer',
      status: 'AUTONOMOUS',
      color: 'from-indigo-600 to-brand-600',
      description: 'Maintains long-term memory, triggers cross-agent workflows, and dispatches human-in-the-loop approval cards.',
      tasks: [
        { name: 'run_full_swarm_cycle', label: 'Execute Full Swarm Cycle' }
      ]
    }
  ];

  const agentList = agents && agents.length > 0 ? agents : defaultAgents;

  const filteredAgents = agentList.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRunTaskDirect = async (agentId, taskName, e) => {
    e.stopPropagation();
    setIsRunning(true);
    setTaskResult(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_name: taskName, payload: {} })
      });
      const data = await res.json();
      setTaskResult(data);
      if (showToast) {
        showToast('Task Complete ⚡', `Agent executed task '${taskName}'.`, 'success');
      }
    } catch (err) {
      setTaskResult({ success: false, error: err.message });
      if (showToast) {
        showToast('Execution Error', err.message, 'error');
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-950/80 via-surface-900 to-surface-900 border border-brand-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">7-Agent Autonomous Operations Swarm</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Specialized background workers coordinating stock calibration, PO preparation, natural language multilingual order parsing, and cash recovery with zero human friction.
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            7 / 7 Active
          </span>
        </div>
      </div>

      {/* 7-Agent Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            className="p-4 rounded-2xl bg-surface-900/80 border border-slate-800 hover:border-brand-500/60 hover:shadow-lg hover:shadow-brand-500/10 transition flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                  {agent.status || 'ACTIVE'}
                </span>
              </div>
              <h3 className="font-bold text-white text-xs group-hover:text-brand-300 transition">
                {agent.name}
              </h3>
              <span className="text-[11px] text-brand-400 font-mono block mt-0.5">{agent.role}</span>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-3">
                {agent.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <span>Autonomous Tasks:</span>
                <span className="text-brand-400 font-medium group-hover:underline flex items-center gap-0.5">
                  Inspect &rarr;
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(agent.tasks || [{ name: 'health_check', label: 'Check Status' }]).map((t, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleRunTaskDirect(agent.id, t.name, e)}
                    disabled={isRunning}
                    className="px-2 py-1 rounded-md bg-surface-950 hover:bg-brand-600/30 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-medium transition flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5 text-brand-400 fill-current" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Execution Output Drawer */}
      {taskResult && (
        <div className="p-4 rounded-xl bg-surface-950 border border-brand-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Autonomous Task Output
            </span>
            <button
              onClick={() => setTaskResult(null)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer"
            >
              Close
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-surface-900 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-48">
            {JSON.stringify(taskResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Agent Detail Modal */}
      <AgentDetailModal
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        agent={selectedAgent}
        showToast={showToast}
      />
    </div>
  );
}
