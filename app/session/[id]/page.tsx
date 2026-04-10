'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import {
  FaStop,
  FaPaperPlane,
  FaClock,
  FaMoneyBillWave,
  FaUserTie,
  FaComments,
  FaExclamationTriangle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface SessionMessage {
  id: string;
  role: 'user' | 'expert';
  content: string;
  timestamp: Date;
}

/**
 * صفحة الجلسة الاستشارية الخاصة
 *
 * الميزات المنفذة:
 *  - تايمر للجلسة (بالدقائق والثواني)
 *  - شات نصي بين المستخدم والخبير
 *  - حساب التكلفة بناءً على الوقت المنقضي
 *  - زر إنهاء الجلسة
 *
 * للتطوير المستقبلي:
 *  - ربط بـ Firestore لمزامنة الرسائل في الوقت الفعلي
 *  - دمج مدفوعات عند إنهاء الجلسة
 *  - إضافة مكالمة صوتية/فيديو
 */
export default function SessionPage({ params }: { params: { id: string } }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const HOURLY_RATE = 300; // ريال / ساعة
  const [elapsed, setElapsed] = useState(0); // seconds
  const [isActive, setIsActive] = useState(true);
  const [messages, setMessages] = useState<SessionMessage[]>([
    {
      id: '0',
      role: 'expert',
      content: 'مرحباً! أنا جاهز لمساعدتك. ما الذي تودّ الاستفسار عنه؟',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculateCost = () => {
    return ((elapsed / 3600) * HOURLY_RATE).toFixed(2);
  };

  const sendMessage = () => {
    if (!input.trim() || !isActive) return;
    const userMsg: SessionMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulate expert response (replace with real Firestore in production)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'expert',
          content: 'شكراً على سؤالك. سأرد عليك بالتفصيل...\n\n(هذا رد تجريبي – في الإصدار الحقيقي سيتلقى الخبير رسالتك مباشرة)',
          timestamp: new Date(),
        },
      ]);
    }, 1500);
  };

  const endSession = () => {
    setIsActive(false);
    setShowEndModal(false);
    toast.success(`انتهت الجلسة. المدة: ${formatTime(elapsed)} | التكلفة: ${calculateCost()} ريال`);
    setTimeout(() => router.push('/wallet'), 3000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600 mb-4">يجب تسجيل الدخول أولاً</p>
          <Link href="/login" className="text-primary-600 hover:underline font-medium">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-blue-400 flex items-center justify-center text-white">
            <FaUserTie size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800">جلسة استشارية #{params.id}</p>
            <p className="text-slate-400 text-sm flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
              {isActive ? 'جلسة نشطة' : 'انتهت الجلسة'}
            </p>
          </div>
        </div>

        {/* Timer & Cost */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-primary-700 font-mono font-extrabold text-xl">
              <FaClock size={16} className={isActive ? 'animate-pulse' : ''} />
              {formatTime(elapsed)}
            </div>
            <p className="text-slate-400 text-xs">المدة</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-green-700 font-extrabold text-xl">
              <FaMoneyBillWave size={16} />
              {calculateCost()}
            </div>
            <p className="text-slate-400 text-xs">ريال</p>
          </div>
          {isActive && (
            <button
              onClick={() => setShowEndModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all"
            >
              <FaStop size={12} />
              إنهاء الجلسة
            </button>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <FaComments className="text-primary-500" size={16} />
          <h2 className="font-bold text-slate-800">محادثة الجلسة</h2>
        </div>

        {/* Messages */}
        <div className="p-5 space-y-4 h-[400px] overflow-y-auto bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-fadeIn`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm'
                }`}
              >
                <p className={`text-xs font-semibold mb-1 ${msg.role === 'user' ? 'text-primary-200' : 'text-primary-500'}`}>
                  {msg.role === 'user' ? profile?.displayName || 'أنت' : 'الخبير'}
                </p>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={isActive ? 'اكتب رسالتك للخبير...' : 'انتهت الجلسة'}
            disabled={!isActive}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm bg-slate-50 text-slate-800 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!isActive || !input.trim()}
            className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-blue-500 flex items-center justify-center text-white disabled:opacity-40 hover:shadow-md transition-all"
          >
            <FaPaperPlane size={15} />
          </button>
        </div>
      </div>

      {/* End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slideUp">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <FaExclamationTriangle className="text-red-500" size={24} />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-2">إنهاء الجلسة؟</h3>
              <p className="text-slate-500 text-sm">هل أنت متأكد من إنهاء الجلسة؟</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">مدة الجلسة:</span>
                <span className="font-bold text-slate-800">{formatTime(elapsed)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">التكلفة الإجمالية:</span>
                <span className="font-bold text-green-600">{calculateCost()} ريال</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={endSession}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all"
              >
                إنهاء الجلسة
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all"
              >
                متابعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
