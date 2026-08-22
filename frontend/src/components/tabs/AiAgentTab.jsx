import React, { useState } from 'react';
import { Cpu, Send, Sparkles, Volume2, Bot, CheckCircle2 } from 'lucide-react';

export default function AiAgentTab({ dashboard, onSwitchTab, showToast }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '🤖 **BizPilot AI Command Center Operational.**\n\nI have real-time read/write access to your SQLite business database. You can ask me questions about stockout predictions, cashflow health, supplier cost matrices, or dispatch approval decisions.'
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const sampleQueries = [
    'Which product has the highest stockout risk right now?',
    'Can I afford a ₹15,000 inventory order today based on cashflow?',
    'Draft a polite Telugu Khata payment reminder for Rahul',
    'Compare suppliers for Boat BassHeads Earphones and pick the best one'
  ];

  const handleSendQuery = async (customQuery = null) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setQuery('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/ai/command-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend })
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer || 'I evaluated your business database.',
          cognition: data.cognition_trail
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `⚠️ Error executing query: ${err.message}` }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      const clean = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/80 via-surface-900 to-surface-900 border border-brand-500/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <Cpu className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Agent Cognition & Command Center</h2>
            <p className="text-[11px] text-slate-400">
              Direct reasoning engine grounded in your live sales, inventory, and supplier databases.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] shrink-0">
        <span className="text-slate-500 font-mono shrink-0">Suggested:</span>
        {sampleQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(q)}
            className="px-2.5 py-1 rounded-lg bg-surface-900 hover:bg-brand-600/30 text-slate-300 hover:text-white border border-slate-800 transition shrink-0 cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-3.5 p-4 rounded-2xl bg-surface-900/60 border border-slate-800">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-800 text-white rounded-br-none border border-slate-700'
                  : 'bg-brand-950/60 text-slate-200 rounded-bl-none border border-brand-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span>{msg.sender === 'user' ? '👤 Business Owner' : '🤖 BizPilot AI Operations Agent'}</span>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleSpeak(msg.text)}
                    className="text-brand-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" /> Speak
                  </button>
                )}
              </div>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="p-3 rounded-2xl bg-brand-950/40 border border-brand-500/30 text-brand-300 text-xs flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Analyzing live database and computing optimal answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="p-3 rounded-2xl bg-surface-900 border border-slate-800 flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Ask anything about stock, revenue, Khata debtors, or supplier pricing..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
          className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium px-2"
        />
        <button
          onClick={() => handleSendQuery()}
          disabled={isThinking}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-brand-500/20 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      </div>
    </div>
  );
}
