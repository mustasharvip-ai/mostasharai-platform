'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  FaHome,
  FaWallet,
  FaUserShield,
  FaSignInAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaChevronDown,
} from 'react-icons/fa';
import { MdOutlineConsultation } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/');
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-primary-700 font-extrabold text-2xl hover:text-primary-600 transition-colors"
          >
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-blue-500 flex items-center justify-center text-white text-lg font-black shadow">
              م
            </span>
            <span>مستشاري</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-600 hover:text-primary-700 hover:bg-primary-50 transition-all text-sm font-medium"
            >
              <FaHome size={14} />
              الرئيسية
            </Link>

            {user && (
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-600 hover:text-primary-700 hover:bg-primary-50 transition-all text-sm font-medium"
              >
                <FaWallet size={14} />
                المحفظة
                {profile?.balance !== undefined && (
                  <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-bold">
                    {profile.balance} ر.س
                  </span>
                )}
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
              >
                <FaUserShield size={14} />
                لوحة التحكم
              </Link>
            )}
          </div>

          {/* User Auth */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 transition-all text-primary-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                    {profile?.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'م'}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {profile?.displayName || 'مستخدم'}
                  </span>
                  <FaChevronDown size={10} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-fadeIn">
                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FaSignOutAlt size={13} />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-blue-500 rounded-lg hover:shadow-md hover:opacity-90 transition-all"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-fadeIn">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-all"
            >
              <FaHome size={15} /> الرئيسية
            </Link>
            {user && (
              <Link
                href="/wallet"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-all"
              >
                <FaWallet size={15} /> المحفظة
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <FaUserShield size={15} /> لوحة التحكم
              </Link>
            )}
            <hr className="border-slate-100 my-1" />
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
              >
                <FaSignOutAlt size={15} /> تسجيل الخروج
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-center text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-all"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-center text-white bg-gradient-to-r from-primary-600 to-blue-500 rounded-lg"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
