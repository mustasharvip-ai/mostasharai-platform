'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  FaWallet,
  FaPlus,
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface BalanceRequest {
  id: string;
  userId: string;
  amount: number;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: { seconds: number } | null;
}

const STATUS_CONFIG = {
  pending: {
    label: 'قيد المراجعة',
    icon: FaClock,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  },
  approved: {
    label: 'تمت الموافقة',
    icon: FaCheckCircle,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  rejected: {
    label: 'مرفوض',
    icon: FaTimesCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
};

export default function WalletPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [requests, setRequests] = useState<BalanceRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Real-time balance
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data().balance || 0);
      }
    });
    return () => unsub();
  }, [user]);

  // Real-time balance requests
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'balanceRequests'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as BalanceRequest[];
        setRequests(data);
        setRequestsLoading(false);
      },
      (err) => {
        console.error(err);
        setRequestsLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (parsedAmount > 10000) {
      toast.error('الحد الأقصى للطلب الواحد 10,000 ريال');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'balanceRequests'), {
        userId: user!.uid,
        userEmail: user!.email,
        userName: profile?.displayName || 'مستخدم',
        amount: parsedAmount,
        note: note.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast.success('تم إرسال طلب الشحن بنجاح! سيتم مراجعته قريباً.');
      setAmount('');
      setNote('');
      setShowForm(false);
    } catch {
      toast.error('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (!user) return null;

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
        <FaWallet className="text-primary-600" />
        محفظتي
      </h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-6 w-56 h-56 rounded-full bg-white" />
        </div>
        <div className="relative">
          <p className="text-white/70 text-sm mb-1">الرصيد المتاح</p>
          <p className="text-5xl font-black mb-1">
            {balance.toLocaleString('ar-SA')}
          </p>
          <p className="text-white/80 text-lg">ريال سعودي</p>
          {pendingCount > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 text-sm w-fit">
              <FaClock size={13} />
              {pendingCount} طلب قيد المراجعة
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="absolute top-6 left-6 flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary-50 transition-all shadow"
        >
          <FaPlus size={12} />
          شحن الرصيد
        </button>
      </div>

      {/* Charge Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 animate-slideUp">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-green-500" />
            طلب شحن رصيد جديد
          </h2>
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                المبلغ المطلوب (ريال سعودي) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="مثال: 500"
                min="1"
                max="10000"
                step="1"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm bg-slate-50 text-slate-800"
                required
                disabled={submitting}
              />
              <p className="text-slate-400 text-xs mt-1">الحد الأدنى: 1 ريال | الحد الأقصى: 10,000 ريال</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ملاحظة (اختياري)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="مثال: تحويل بنكي، رقم العملية..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm bg-slate-50 text-slate-800 resize-none"
                disabled={submitting}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin" size={13} />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <FaPlus size={13} />
                    إرسال الطلب
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-4">سجل طلبات الشحن</h2>
        {requestsLoading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin text-primary-400" size={24} />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FaWallet size={32} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد طلبات شحن حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const config = STATUS_CONFIG[req.status];
              const Icon = config.icon;
              const date = req.createdAt
                ? new Date(req.createdAt.seconds * 1000).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '';
              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <FaMoneyBillWave className="text-primary-500" size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {req.amount.toLocaleString('ar-SA')} ريال
                      </p>
                      {req.note && (
                        <p className="text-slate-400 text-xs truncate max-w-[200px]">{req.note}</p>
                      )}
                      <p className="text-slate-300 text-xs">{date}</p>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${config.color}`}
                  >
                    <Icon size={11} />
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
