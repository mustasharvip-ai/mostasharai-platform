'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import {
  FaVideo,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideoSlash,
  FaCommentAlt,
  FaPaperPlane,
  FaUsers,
  FaSignOutAlt,
  FaCircle,
} from 'react-icons/fa';

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  time: string;
}

/**
 * صفحة البث المباشر
 *
 * هيكل جاهز لدمج WebRTC أو LiveKit أو Agora.
 * لتفعيل البث الحقيقي، يمكن:
 *  1. استخدام LiveKit SDK: npm install @livekit/components-react livekit-client
 *  2. استخدام Agora RTC: npm install agora-rtc-sdk-ng
 *  3. أو WebRTC الأصلي مع PeerJS/simple-peer
 *
 * الإعداد المطلوب:
 *  - NEXT_PUBLIC_LIVEKIT_URL (أو AGORA_APP_ID)
 *  - خادم signaling لـ WebRTC
 */
export default function LivePage({ params }: { params: { id: string } }) {
  const { user, profile } = useAuth();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', author: 'النظام', text: 'مرحباً بكم في البث المباشر!', time: '09:00' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount] = useState(Math.floor(Math.random() * 50) + 5);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // TODO: Initialize WebRTC / LiveKit connection here
  // Example with LiveKit:
  // const room = new Room();
  // await room.connect(LIVEKIT_URL, token);

  // Initialize local camera preview
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOn,
          audio: isMicOn,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        console.warn('Camera/mic access denied – showing placeholder');
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        author: profile?.displayName || 'مشاهد',
        text: chatInput.trim(),
        time,
      },
    ]);
    setChatInput('');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-900">
      {/* Video Area */}
      <div className={`flex-1 flex flex-col ${chatOpen ? 'md:mr-0' : ''}`}>
        {/* Live Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              <FaCircle size={7} className="animate-pulse" />
              مباشر
            </div>
            <span className="text-slate-300 text-sm font-medium">جلسة بث مباشر #{params.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300 text-sm">
              <FaUsers size={13} />
              <span>{viewerCount}</span>
            </div>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
            >
              <FaSignOutAlt size={12} />
              مغادرة
            </Link>
          </div>
        </div>

        {/* Video */}
        <div className="flex-1 bg-black relative flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain"
          />
          {/* Placeholder when no stream */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
            <div className="text-center text-white">
              <FaVideo size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold opacity-60">البث المباشر</p>
              <p className="text-sm opacity-40 mt-1">
                قيد التطوير – سيتم دمج WebRTC قريباً
              </p>
            </div>
          </div>

          {/* Self preview (picture-in-picture) */}
          <div className="absolute bottom-4 left-4 w-32 h-20 bg-slate-700 rounded-xl border border-slate-600 overflow-hidden flex items-center justify-center">
            <span className="text-white/40 text-xs">كاميرتك</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-5 py-4 bg-slate-800 border-t border-slate-700">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMicOn ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title={isMicOn ? 'كتم المايك' : 'تشغيل المايك'}
          >
            {isMicOn ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
          </button>

          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isCameraOn ? 'bg-slate-600 text-white hover:bg-slate-500' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
            title={isCameraOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          >
            {isCameraOn ? <FaVideo size={18} /> : <FaVideoSlash size={18} />}
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              chatOpen ? 'bg-primary-600 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'
            }`}
            title="الشات"
          >
            <FaCommentAlt size={16} />
          </button>

          <Link
            href="/"
            className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-all"
            title="إنهاء البث"
          >
            <FaSignOutAlt size={18} />
          </Link>
        </div>
      </div>

      {/* Chat Sidebar */}
      {chatOpen && (
        <div className="w-80 flex flex-col bg-slate-800 border-r border-slate-700">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold text-sm">الشات المباشر</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fadeIn">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-primary-400 text-xs font-bold">{msg.author}</span>
                  <span className="text-slate-500 text-xs">{msg.time}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{msg.text}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder={user ? 'اكتب رسالة...' : 'سجل دخولك للمشاركة'}
              disabled={!user}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
            />
            <button
              onClick={sendChat}
              disabled={!user || !chatInput.trim()}
              className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white disabled:opacity-50 hover:bg-primary-700 transition-colors"
            >
              <FaPaperPlane size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
