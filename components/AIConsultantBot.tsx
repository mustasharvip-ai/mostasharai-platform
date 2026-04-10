'use client';

import { useState, useRef, useEffect } from 'react';
import { askAI } from '@/lib/gemini';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner } from 'react-icons/fa';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  'كيف أجد محامياً مناسباً؟',
  'ما هي أفضل منصة للاستشارات التقنية؟',
  'كيف أبدأ مشروعاً تجارياً ناجحاً؟',
  'ما هي حقوقي كموظف؟',
  'كيف أختار مستشاراً مالياً؟',
];

export default function AIConsultantBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      content:
        'مرحباً بك في منصة مستشاري! 👋\nأنا مساعدك الذكي. يمكنني مساعدتك في إيجاد الخبير المناسب أو الإجابة على أسئلتك العامة. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAI(messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-700 to-blue-600">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <FaRobot className="text-white" size={18} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">المساعد الذكي</p>
                <p className="text-white/70 text-xs">متاح دائماً</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <FaSpinner className="animate-spin text-primary-500" size={14} />
                  <span className="text-slate-500 text-sm">يفكر...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-3 py-2 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar bg-white">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="flex-shrink-0 text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full border border-primary-100 hover:bg-primary-100 transition-all whitespace-nowrap disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent bg-slate-50 disabled:opacity-50 text-slate-800"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-600 to-blue-500 flex items-center justify-center text-white disabled:opacity-50 hover:shadow-md transition-all disabled:cursor-not-allowed"
            >
              {loading ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <FaPaperPlane size={14} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-blue-500 flex items-center justify-center shadow-2xl hover:shadow-primary-300/50 hover:scale-110 transition-all"
        title="المساعد الذكي"
      >
        {isOpen ? (
          <FaTimes className="text-white" size={20} />
        ) : (
          <FaRobot className="text-white" size={22} />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  );
}
