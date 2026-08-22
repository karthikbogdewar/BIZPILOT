import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, X } from 'lucide-react';

export default function WhatsAppModal({ isOpen, onClose, onOrderCreated, showToast }) {
  const [customerName, setCustomerName] = useState('Bhanu Reddy');
  const [message, setMessage] = useState('naku 2 fast chargers mariyu 1 redmi phone kavali');
  const [chatLog, setChatLog] = useState([
    {
      sender: 'agent',
      text: '🙏 నమస్కారం! శ్రీ లక్ష్మి ఎలక్ట్రానిక్స్ కు స్వాగతం. మేము మీకు ఎలా సహాయపడగలము? (Welcome to Sri Lakshmi Electronics. How can we help you today?)'
    }
  ]);
  const [isSending, setIsSending] = useState(false);

  const sampleMessages = [
    { label: 'Telugu Order', text: 'నమస్కారం అండి, నాకు 2 ఫాస్ట్ ఛార్జర్లు మరియు 1 రెడ్మీ ఫోన్ కావాలి అర్జెంట్ గా' },
    { label: 'Hindi Order', text: 'नमस्ते भाईसाहब, मुझे 2 Boat ईयरफोन और 1 पावर बैंक भेज दो' },
    { label: 'Price Inquiry', text: 'Boat earphones price entha? Stock unnaya?' },
    { label: 'Greeting Smalltalk', text: 'Hello bhaiya, ela unnaru? Shop open undha?' },
    { label: 'English Order', text: 'Hi, I need 2 units of GaN chargers and 1 smartphone' }
  ];

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || message;
    if (!textToSend.trim()) return;

    // Add user message to log
    setChatLog((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/customer/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          customer_name: customerName,
          channel: 'WhatsApp'
        })
      });
      const data = await res.json();
      
      // Add agent reply
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: data.drafted_reply || 'Order received successfully!',
          isOrder: data.order_created
        }
      ]);

      if (data.order_created) {
        showToast('Order Placed & Stock Reserved! 📦', `Order created for ₹${data.total_amount}.`, 'success');
        if (onOrderCreated) onOrderCreated();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-900 border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/80 to-surface-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Multilingual Customer Order & Chat Simulator
              </h3>
              <p className="text-[11px] text-slate-400">
                Simulating WhatsApp / Telegram conversational order processing
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs px-2 py-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div className="p-3 bg-surface-950/80 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-mono shrink-0">Try:</span>
          {sampleMessages.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.text)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-700 transition shrink-0 cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-surface-950/50">
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white rounded-br-none border border-slate-700'
                    : 'bg-emerald-950/60 text-slate-100 rounded-bl-none border border-emerald-500/40'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 mb-1">
                  {msg.sender === 'user' ? customerName : '🤖 BizPilot AI Store Clerk'}
                </div>
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
                <span>Agent typing response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Input Box */}
        <div className="p-3.5 bg-surface-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type customer message in Telugu, Hindi, or English..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-surface-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isSending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
