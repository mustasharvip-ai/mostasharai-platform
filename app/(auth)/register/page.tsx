'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    return 'strong';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }
    if (displayName.trim().length < 3) {
      toast.error('الاسم يجب أن يكون 3 أحرف على الأقل');
      return;
    }
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const { user } = credential;

      await updateProfile(user, { displayName: displayName.trim() });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName.trim(),
        balance: 0,
        role: 'user',
        banned: false,
        photoURL: '',
        createdAt: serverTimestamp(),
      });

      toast.success('تم إنشاء حسابك بنجاح! مرحباً بك 🎉');
      router.push('/');
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        toast.error('هذا البريد الإلكتروني مستخدم بالفعل');
      } else if (code === 'auth/invalid-email') {
        toast.error('صيغة البريد الإلكتروني غير صحيحة');
      } else if (code === 'auth/weak-password') {
        toast.error('كلمة المرور ضعيفة جداً');
      } else {
        toast.error('حدث خطأ أثناء إنشاء الحساب');
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-blue-500 items-center justify-center text-white text-3xl font-black shadow-xl mb-3">
            م
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">إنشاء حساب جديد</h1>
          <p className="text-slate-500 text-sm mt-1">انضم إلى مجتمع المستشارين المهنيين</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الاسم الكامل
              </label>
              <div className="relative">
                <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="محمد عبدالله"
                  className="w-full pr-11 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent text-sm bg-slate-50 text-slate-800"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pr-11 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent text-sm bg-slate-50 text-slate-800"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <FaLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full pr-11 pl-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent text-sm bg-slate-50 text-slate-800"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              {strength && (
                <div className="mt-2 flex gap-1">
                  {['weak', 'medium', 'strong'].map((s, i) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        strength === 'weak' && i === 0
                          ? 'bg-red-400'
                          : strength === 'medium' && i <= 1
                          ? 'bg-yellow-400'
                          : strength === 'strong'
                          ? 'bg-green-400'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <FaLock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  className={`w-full pr-11 pl-11 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent text-sm bg-slate-50 text-slate-800 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-300'
                      : confirmPassword && confirmPassword === password
                      ? 'border-green-300'
                      : 'border-slate-200'
                  }`}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
                {confirmPassword && confirmPassword === password && (
                  <FaCheckCircle className="absolute left-10 top-1/2 -translate-y-1/2 text-green-500" size={14} />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:opacity-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" size={15} />
                  جاري إنشاء الحساب...
                </>
              ) : (
                'إنشاء الحساب'
              )}
            </button>
          </form>

          <p className="text-slate-400 text-xs text-center mt-4">
            بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية
          </p>

          <div className="mt-4 text-center">
            <p className="text-slate-500 text-sm">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-primary-600 font-bold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
