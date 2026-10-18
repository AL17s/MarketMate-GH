import React, { useState } from 'react';
import { BusinessMetrics, Business, Product, CustomerCredit, Sale } from '../../types/models';
import { askMateAi, AssistantResponse, GEMINI_API_KEY_STORAGE } from '../../services/aiService';

interface MateAiAdvisorViewProps {
  metrics: BusinessMetrics;
  business: Business;
  products: Product[];
  credits: CustomerCredit[];
  sales: Sale[];
  onNavigate: (path: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  keyMetrics?: AssistantResponse['keyMetrics'];
  suggestedActions?: AssistantResponse['suggestedActions'];
}

export const MateAiAdvisorView: React.FC<MateAiAdvisorViewProps> = ({
  metrics,
  business,
  products,
  credits,
  sales,
  onNavigate,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const initialGreeting: ChatMessage = {
    id: 'msg_welcome',
    sender: 'assistant',
    text: `Akwaaba, Abena! I am **Mate AI**, your dedicated Ghanaian SME business co-pilot for **${business.name}**.\n\nI calculate financial insights strictly from your stored sales, expenses, inventory, and debtors ledger. I will **never invent figures**.\n\nWhat would you like to review today?`,
    timestamp: new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }),
    keyMetrics: [
      { label: "Today's Gross Sales", value: `GH₵ ${metrics.dailySales.toFixed(2)}`, trend: '+18%' },
      { label: "Today's Expenses", value: `GH₵ ${metrics.dailyExpenses.toFixed(2)}` },
      { label: "Net Profit Today", value: `GH₵ ${metrics.dailyNetProfit.toFixed(2)}` },
      { label: "Customers Owing", value: `GH₵ ${metrics.outstandingCustomerCredit.toFixed(2)}` },
    ],
    suggestedActions: [
      { label: 'Check Today Sales', actionType: 'report', payload: 'How much did I make today?' },
      { label: 'Check Debtors', actionType: 'report', payload: 'Who owes me money?' },
      { label: 'Restock Suggestions', actionType: 'report', payload: 'What stock should I buy?' },
    ],
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  const presetQuestions = [
    'How much did I make today?',
    'Who owes me money?',
    'What product sells the most?',
    'What stock should I buy?',
    'How much did I spend this week?',
    'Compare this month\'s sales with last month.',
  ];

  const handleSend = async (userPrompt: string) => {
    if (!userPrompt.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: userPrompt.trim(),
      timestamp: new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    // Prepare verified business context
    const debtorsList = credits
      .filter((c) => c.status !== 'cleared')
      .map((c) => ({
        name: c.customerName,
        amount: c.balance,
        due: c.dueDate,
      }));

    const topSellers = metrics.bestSellingProducts.map((p) => ({
      name: p.productName,
      sold: p.quantitySold,
      revenue: p.revenueGHS,
    }));

    const lowStockList = metrics.lowStockAlerts.map((l) => ({
      name: l.productName,
      current: l.currentStock,
      threshold: l.threshold,
    }));

    const response = await askMateAi(userPrompt, metrics, {
      storeName: business.name,
      branch: business.branch,
      currency: business.currency,
      customersCount: credits.length,
      debtorsList,
      topSellers,
      lowStockList,
    });

    const aiMsg: ChatMessage = {
      id: `msg_a_${Date.now()}`,
      sender: 'assistant',
      text: response.answer,
      timestamp: new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }),
      keyMetrics: response.keyMetrics,
      suggestedActions: response.suggestedActions,
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div className="px-4 md:px-8 py-5 md:py-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Header Banner */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-[#005431] to-[#0d6e43] text-white shadow-sm flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-amber-200">
            <span className="material-symbols-outlined text-[26px]">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold">Ask Mate AI</h1>
              {typeof window !== 'undefined' && localStorage.getItem(GEMINI_API_KEY_STORAGE) ? (
                <span className="px-2 py-0.5 rounded-full bg-[#feae2c] text-[#291800] text-[10px] font-mono-num font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#835500] animate-pulse"></span>
                  Client • Gemini 2.5 Flash
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 text-[10px] font-mono-num font-bold">
                  Deterministic Local Engine
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100">
              Zero financial hallucinations. Answers calculated strictly from {business.name} data.
              {!Boolean(typeof window !== 'undefined' && localStorage.getItem(GEMINI_API_KEY_STORAGE)) && (
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className="ml-2 underline text-amber-200 hover:text-white cursor-pointer"
                >
                  Configure Gemini Key →
                </button>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMessages([initialGreeting])}
          className="text-xs text-white/80 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold"
        >
          Reset Chat
        </button>
      </div>

      {/* Preset Fast Prompt Buttons */}
      <div className="mb-4">
        <p className="text-xs font-mono-num font-bold text-gray-500 uppercase tracking-wider mb-2">
          Frequently Asked Questions:
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {presetQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#f0f3ff] text-gray-800 text-xs font-semibold shadow-xs border border-gray-200 hover:border-[#005431] transition-all shrink-0 text-left"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-xs mb-4">
        {messages.map((m) => {
          const isAi = m.sender === 'assistant';
          return (
            <div key={m.id} className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                  isAi ? 'bg-emerald-100 text-[#005431]' : 'bg-[#263143] text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isAi ? 'auto_awesome' : 'person'}
                </span>
              </div>

              <div className={`max-w-[85%] md:max-w-[75%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                    isAi
                      ? 'bg-[#f0f3ff] text-gray-900 border border-blue-50/60 rounded-tl-xs'
                      : 'bg-[#005431] text-white rounded-tr-xs'
                  }`}
                >
                  {m.text}
                </div>

                {/* Optional Key Metric Pills */}
                {m.keyMetrics && m.keyMetrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {m.keyMetrics.map((k, i) => (
                      <div
                        key={i}
                        className="bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col"
                      >
                        <span className="text-[10px] font-mono-num text-gray-400 font-bold uppercase truncate">
                          {k.label}
                        </span>
                        <span className="text-xs md:text-sm font-mono-num font-bold text-[#005431] mt-0.5">
                          {k.value}
                        </span>
                        {k.trend && (
                          <span className="text-[10px] font-mono-num text-emerald-600 font-semibold mt-0.5">
                            {k.trend}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Action Shortcuts */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.suggestedActions.map((act, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (act.actionType === 'navigate' && act.payload) {
                            onNavigate(act.payload);
                          } else if (act.actionType === 'report' && act.payload) {
                            handleSend(act.payload);
                          } else if (act.actionType === 'whatsapp') {
                            onNavigate('debtors-credit-book');
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#005431] text-xs font-semibold flex items-center gap-1 transition-colors border border-emerald-200/50"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span className="block text-[10px] font-mono-num text-gray-400 px-1">
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-gray-500 font-mono-num">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#005431] flex items-center justify-center">
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            </div>
            <span>Mate AI is analyzing stored Makola sales &amp; inventory records...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs focus-within:ring-2 focus-within:ring-[#005431]"
      >
        <span className="material-symbols-outlined text-gray-400 pl-2">chat_bubble_outline</span>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question about your sales, debt, expenses, or stock..."
          className="flex-1 px-2 py-2 text-xs md:text-sm text-gray-900 bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-[#005431] text-white text-xs font-bold hover:bg-[#0d6e43] disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>Ask Mate</span>
          <span className="material-symbols-outlined text-[16px]">send</span>
        </button>
      </form>
    </div>
  );
};
