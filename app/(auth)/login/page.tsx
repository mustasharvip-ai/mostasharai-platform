'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success('مرحباً بك مجدداً! 👋');
      router.push('/');
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (code === 'auth/too-many-requests') {
        toast.error('تم تجاوز عدد المحاولات. يرجى المحاولة لاحقاً');
      } else if (code === 'auth/invalid-email') {
        toast.error('صيغة البريد الإلكتروني غير صحيحة');
      } else {
        toast.error('حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-blue-500 items-center justify-center text-white text-3xl font-black shadow-xl mb-3">
            م
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">أهلاً بعودتك</h1>
          <p className="text-slate-500 text-sm mt-1">سجل دخولك إلى منصة مستشاري</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <FaEnvelope
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full pr-11 pl-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent text-sm transition-all bg-slate-50 text-slate-800"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <FaLock
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={15}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-11 pl-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent text-sm transition-all bg-slate-50 text-slate-800"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:opacity-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" size={15} />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              ليس لديك حساب؟{' '}
              <Link
                href="/register"
                className="text-primary-600 font-bold hover:underline"
              >
                سجل مجاناً
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
