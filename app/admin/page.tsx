'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  FaUserShield,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaStar,
  FaUsers,
  FaFileAlt,
  FaMoneyBillWave,
  FaSearch,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface BalanceRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: { seconds: number } | null;
}

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  role: 'user' | 'admin' | 'expert';
  banned?: boolean;
  createdAt: { seconds: number } | null;
}

type Tab = 'requests' | 'users' | 'stats';

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<BalanceRequest[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [statsData, setStatsData] = useState({ users: 0, posts: 0, requests: 0 });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && profile.role !== 'admin') {
        toast.error('ليس لديك صلاحية الوصول لهذه الصفحة');
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  // Fetch requests
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;
    const q = query(collection(db, 'balanceRequests'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BalanceRequest[]);
    });
  }, [user, profile]);

  // Fetch users
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ ...d.data() })) as UserRecord[]);
    });
  }, [user, profile]);

  // Stats
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;
    const fetchStats = async () => {
      try {
        const [uSnap, pSnap, rSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'posts')),
          getDocs(collection(db, 'balanceRequests')),
        ]);
        setStatsData({
          users: uSnap.size,
          posts: pSnap.size,
          requests: rSnap.size,
        });
      } catch {}
    };
    fetchStats();
  }, [user, profile]);

  const approveRequest = async (req: BalanceRequest) => {
    if (processingId) return;
    setProcessingId(req.id);
    try {
      await updateDoc(doc(db, 'balanceRequests', req.id), { status: 'approved' });
      await updateDoc(doc(db, 'users', req.userId), {
        balance: increment(req.amount),
      });
      toast.success(`تمت الموافقة على طلب ${req.userName} بمبلغ ${req.amount} ريال`);
    } catch {
      toast.error('حدث خطأ أثناء الموافقة');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (req: BalanceRequest) => {
    if (processingId) return;
    setProcessingId(req.id);
    try {
      await updateDoc(doc(db, 'balanceRequests', req.id), { status: 'rejected' });
      toast.success('تم رفض الطلب');
    } catch {
      toast.error('حدث خطأ أثناء الرفض');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleBan = async (u: UserRecord) => {
    try {
      await updateDoc(doc(db, 'users', u.uid), { banned: !u.banned });
      toast.success(u.banned ? `تم رفع الحظر عن ${u.displayName}` : `تم حظر ${u.displayName}`);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const changeRole = async (u: UserRecord, role: 'user' | 'admin' | 'expert') => {
    try {
      await updateDoc(doc(db, 'users', u.uid), { role });
      toast.success(`تم تغيير دور ${u.displayName} إلى ${role === 'admin' ? 'مدير' : role === 'expert' ? 'خبير' : 'مستخدم'}`);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (profile.role !== 'admin') return null;

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const filteredUsers = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow">
          <FaUserShield size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">لوحة التحكم</h1>
          <p className="text-slate-500 text-sm">إدارة المنصة والمستخدمين</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: FaUsers, label: 'المستخدمون', value: statsData.users, color: 'text-blue-600 bg-blue-50' },
          { icon: FaFileAlt, label: 'المنشورات', value: statsData.posts, color: 'text-green-600 bg-green-50' },
          { icon: FaMoneyBillWave, label: 'طلبات الشحن', value: statsData.requests, color: 'text-orange-600 bg-orange-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">{value}</p>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
        {([
          { key: 'requests', label: 'طلبات الشحن', badge: pendingRequests.length },
          { key: 'users', label: 'المستخدمون' },
          { key: 'stats', label: 'الإحصائيات' },
        ] as const).map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === key
                ? 'bg-white shadow text-primary-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">طلبات شحن الرصيد</h2>
          </div>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FaMoneyBillWave size={32} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {requests.map((req) => (
                <div key={req.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-slate-800 text-sm">{req.userName}</p>
                      <span className="text-xs text-slate-400">{req.userEmail}</span>
                    </div>
                    <p className="text-primary-600 font-extrabold text-lg">
                      {req.amount.toLocaleString('ar-SA')} ريال
                    </p>
                    {req.note && <p className="text-slate-400 text-xs mt-0.5">{req.note}</p>}
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${
                        req.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-600'
                          : req.status === 'approved'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'موافق' : 'مرفوض'}
                    </span>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2 mr-4">
                      <button
                        onClick={() => approveRequest(req)}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {processingId === req.id ? (
                          <FaSpinner className="animate-spin" size={12} />
                        ) : (
                          <FaCheckCircle size={12} />
                        )}
                        موافقة
                      </button>
                      <button
                        onClick={() => rejectRequest(req)}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        <FaTimesCircle size={12} />
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <FaSearch className="text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن مستخدم..."
              className="flex-1 focus:outline-none text-sm text-slate-700 bg-transparent placeholder-slate-400"
            />
          </div>
          <div className="divide-y divide-slate-50">
            {filteredUsers.map((u) => (
              <div key={u.uid} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-blue-400 flex items-center justify-center text-white font-bold">
                    {u.displayName?.[0] || 'م'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 text-sm">{u.displayName}</p>
                      {u.banned && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100">
                          محظور
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                            : u.role === 'expert'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.role === 'admin' ? 'مدير' : u.role === 'expert' ? 'خبير' : 'مستخدم'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{u.email}</p>
                    <p className="text-primary-600 text-xs font-medium">
                      الرصيد: {(u.balance || 0).toLocaleString('ar-SA')} ريال
                    </p>
                  </div>
                </div>
                {u.uid !== user?.uid && (
                  <div className="flex gap-2 mr-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u, e.target.value as 'user' | 'admin' | 'expert')}
                      className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-300 text-slate-600"
                    >
                      <option value="user">مستخدم</option>
                      <option value="expert">خبير</option>
                      <option value="admin">مدير</option>
                    </select>
                    <button
                      onClick={() => toggleBan(u)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        u.banned
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <FaBan size={10} />
                      {u.banned ? 'رفع الحظر' : 'حظر'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'إجمالي المستخدمين', value: statsData.users, desc: 'مستخدم مسجل في المنصة', color: 'from-blue-600 to-blue-400' },
            { title: 'إجمالي المنشورات', value: statsData.posts, desc: 'منشور تم نشره', color: 'from-green-600 to-green-400' },
            { title: 'طلبات الشحن الكلية', value: statsData.requests, desc: 'طلب شحن رصيد', color: 'from-orange-600 to-orange-400' },
            { title: 'طلبات قيد المراجعة', value: pendingRequests.length, desc: 'بانتظار الموافقة', color: 'from-yellow-600 to-yellow-400' },
          ].map(({ title, value, desc, color }) => (
            <div key={title} className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg`}>
              <p className="text-white/70 text-sm mb-2">{title}</p>
              <p className="text-5xl font-black mb-1">{value}</p>
              <p className="text-white/80 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
