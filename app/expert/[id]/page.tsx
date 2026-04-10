'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import {
  FaStar,
  FaCheckCircle,
  FaVideo,
  FaCalendarAlt,
  FaWhatsapp,
  FaSpinner,
  FaUserTie,
  FaArrowRight,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Expert {
  uid: string;
  displayName: string;
  specialty: string;
  bio: string;
  rating: number;
  sessions: number;
  hourlyRate: number;
  role: string;
  photoURL?: string;
  videoUrl?: string;
  verified?: boolean;
  languages?: string[];
  expertise?: string[];
}

const PLACEHOLDER_EXPERTS: Record<string, Expert> = {
  demo1: {
    uid: 'demo1',
    displayName: 'د. سارة العمري',
    specialty: 'استشارات قانونية',
    bio: 'محامية معتمدة بخبرة 12 عاماً في القانون التجاري والعقود. متخصصة في قضايا الشركات الناشئة وحقوق الملكية الفكرية.',
    rating: 4.9,
    sessions: 320,
    hourlyRate: 300,
    role: 'expert',
    verified: true,
    languages: ['العربية', 'الإنجليزية'],
    expertise: ['القانون التجاري', 'العقود', 'الملكية الفكرية', 'قضايا العمل'],
  },
};

export default function ExpertPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingNote, setBookingNote] = useState('');

  useEffect(() => {
    const fetchExpert = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role === 'expert') {
          setExpert({ uid: docSnap.id, ...docSnap.data() } as Expert);
        } else if (PLACEHOLDER_EXPERTS[params.id]) {
          setExpert(PLACEHOLDER_EXPERTS[params.id]);
        } else {
          setExpert(null);
        }
      } catch {
        if (PLACEHOLDER_EXPERTS[params.id]) {
          setExpert(PLACEHOLDER_EXPERTS[params.id]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchExpert();
  }, [params.id]);

  const handleBooking = () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً لحجز جلسة');
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast.error('يرجى اختيار التاريخ والوقت');
      return;
    }
    toast.success('تم إرسال طلب الحجز! سيتواصل معك الخبير قريباً.');
    setShowBooking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">الخبير غير موجود</h1>
        <p className="text-slate-500 mb-6">لم يتم العثور على الخبير المطلوب</p>
        <Link href="/" className="text-primary-600 hover:underline font-medium">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-6 text-sm font-medium transition-colors"
      >
        <FaArrowRight size={12} />
        العودة للرئيسية
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center sticky top-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-blue-400 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
              {expert.photoURL ? (
                <img src={expert.photoURL} alt={expert.displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                expert.displayName[0]
              )}
            </div>

            <div className="flex items-center justify-center gap-1 mb-1">
              <h1 className="font-extrabold text-slate-800 text-lg">{expert.displayName}</h1>
              {expert.verified && <FaCheckCircle className="text-blue-500" size={16} />}
            </div>
            <p className="text-primary-600 font-medium text-sm mb-3">{expert.specialty}</p>

            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <FaStar
                  key={s}
                  size={14}
                  className={s <= Math.round(expert.rating) ? 'text-yellow-400' : 'text-slate-200'}
                />
              ))}
              <span className="text-slate-600 text-sm font-bold mr-1">{expert.rating}</span>
              <span className="text-slate-400 text-xs">({expert.sessions} جلسة)</span>
            </div>

            <div className="bg-primary-50 rounded-xl p-3 mb-4">
              <p className="text-slate-500 text-xs mb-1">سعر الجلسة (ساعة)</p>
              <p className="text-primary-700 font-extrabold text-2xl">
                {expert.hourlyRate} <span className="text-sm font-normal">ريال</span>
              </p>
            </div>

            <button
              onClick={() => setShowBooking(!showBooking)}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <FaCalendarAlt size={14} />
              احجز جلسة الآن
            </button>

            {expert.languages && (
              <div className="mt-4 text-right">
                <p className="text-slate-400 text-xs mb-2">اللغات:</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {expert.languages.map((lang) => (
                    <span key={lang} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-5">
          {/* Bio */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FaUserTie className="text-primary-500" size={16} />
              نبذة عن الخبير
            </h2>
            <p className="text-slate-600 leading-loose text-sm">{expert.bio}</p>
          </div>

          {/* Expertise */}
          {expert.expertise && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-800 mb-3">مجالات التخصص</h2>
              <div className="flex flex-wrap gap-2">
                {expert.expertise.map((exp) => (
                  <span
                    key={exp}
                    className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-100"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {expert.videoUrl && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FaVideo className="text-red-500" size={16} />
                فيديو تعريفي
              </h2>
              <div className="aspect-video rounded-xl overflow-hidden bg-slate-100">
                <iframe
                  src={expert.videoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  title="فيديو تعريفي"
                />
              </div>
            </div>
          )}

          {/* Booking Form */}
          {showBooking && (
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-6 animate-slideUp">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-primary-500" size={16} />
                حجز جلسة استشارية
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ الجلسة *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">وقت الجلسة *</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm text-slate-800"
                  >
                    <option value="">اختر الوقت</option>
                    {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '20:00', '21:00'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات الجلسة</label>
                  <textarea
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    placeholder="اكتب ما تريد مناقشته في الجلسة..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm resize-none text-slate-800"
                  />
                </div>
                <div className="bg-primary-50 rounded-xl p-3 text-sm">
                  <p className="text-slate-600">
                    سعر الجلسة: <span className="font-bold text-primary-700">{expert.hourlyRate} ريال</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBooking}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-md transition-all"
                  >
                    تأكيد الحجز
                  </button>
                  <button
                    onClick={() => setShowBooking(false)}
                    className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
