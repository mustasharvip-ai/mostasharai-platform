'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import PostCard, { Post } from '@/components/PostCard';
import FirebaseBanner from '@/components/FirebaseBanner';
import { isFirebaseConfigured } from '@/lib/firebase';
import Link from 'next/link';
import {
  FaImage,
  FaSpinner,
  FaTimes,
  FaUsers,
  FaStar,
  FaLightbulb,
  FaBriefcase,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const EXPERTS_PREVIEW = [
  { name: 'د. سارة العمري', specialty: 'استشارات قانونية', rating: 4.9, sessions: 320 },
  { name: 'م. خالد المطيري', specialty: 'تقنية وبرمجة', rating: 4.8, sessions: 215 },
  { name: 'أ. نورة الشمري', specialty: 'استشارات نفسية', rating: 5.0, sessions: 189 },
  { name: 'أ. أحمد البلوي', specialty: 'استشارات أعمال', rating: 4.7, sessions: 410 },
];

export default function HomePage() {
  if (!isFirebaseConfigured) {
    return <FirebaseBanner />;
  }

  return <HomeContent />;
}

function HomeContent() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time posts listener
  useEffect(() => {
    if (!db) { setPostsLoading(false); return; }
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          likes: Array.isArray(doc.data().likes) ? doc.data().likes : [],
        })) as Post[];
        setPosts(fetchedPosts);
        setPostsLoading(false);
      },
      (error) => {
        console.error('Error fetching posts:', error);
        setPostsLoading(false);
        if (error.code !== 'permission-denied') {
          toast.error('حدث خطأ في تحميل المنشورات');
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePost = async () => {
    if (!user || !profile) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    if (!content.trim() && !imageFile) {
      toast.error('يرجى كتابة شيء أو إضافة صورة');
      return;
    }
    if (content.trim().length > 1000) {
      toast.error('المنشور طويل جداً (الحد الأقصى 1000 حرف)');
      return;
    }

    setPosting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: profile.displayName || 'مستخدم',
        authorAvatar: user.photoURL || '',
        content: content.trim(),
        imageUrl,
        likes: [],
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      setContent('');
      removeImage();
      toast.success('تم نشر المنشور بنجاح!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('حدث خطأ أثناء النشر. يرجى المحاولة مرة أخرى.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-5">
          {/* Post Composer */}
          {user ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {profile?.displayName?.[0]?.toUpperCase() || 'م'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="شارك أفكارك أو اسأل الخبراء..."
                    rows={3}
                    className="w-full resize-none text-slate-700 placeholder-slate-400 focus:outline-none text-sm leading-relaxed"
                  />
                  {imagePreview && (
                    <div className="relative mt-2 rounded-xl overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="معاينة"
                        className="w-full max-h-64 object-cover rounded-xl"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary-600 transition-all text-sm font-medium"
                >
                  <FaImage size={16} className="text-green-500" />
                  إضافة صورة
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  onClick={handlePost}
                  disabled={posting || (!content.trim() && !imageFile)}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:shadow-md hover:opacity-90 transition-all flex items-center gap-2"
                >
                  {posting ? (
                    <>
                      <FaSpinner className="animate-spin" size={13} />
                      جاري النشر...
                    </>
                  ) : (
                    'نشر'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary-700 to-blue-600 rounded-2xl p-6 text-center text-white shadow-lg">
              <p className="font-bold text-lg mb-2">انضم إلى مجتمع المستشارين</p>
              <p className="text-white/80 text-sm mb-4">
                سجل دخولك لنشر المنشورات والتفاعل مع الخبراء
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/login"
                  className="px-5 py-2 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-primary-50 transition-all"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-white/20 border border-white/40 text-white rounded-xl font-bold text-sm hover:bg-white/30 transition-all"
                >
                  إنشاء حساب
                </Link>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-11 h-11 rounded-full bg-slate-200" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-slate-200 rounded w-32" />
                      <div className="h-2.5 bg-slate-100 rounded w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-slate-500 font-medium">لا توجد منشورات حتى الآن</p>
              <p className="text-slate-400 text-sm mt-1">كن أول من يشارك!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-primary-700 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
            <h3 className="font-bold text-base mb-4">إحصائيات المنصة</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: FaUsers, label: 'خبير متخصص', value: '500+' },
                { icon: FaStar, label: 'تقييم متوسط', value: '4.9' },
                { icon: FaLightbulb, label: 'جلسة ناجحة', value: '10K+' },
                { icon: FaBriefcase, label: 'مجال تخصص', value: '15+' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/15 rounded-xl p-3 text-center">
                  <Icon className="mx-auto mb-1 text-white/80" size={18} />
                  <p className="font-extrabold text-lg">{value}</p>
                  <p className="text-white/70 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Experts Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">الخبراء المميزون</h3>
              <Link
                href="/experts"
                className="text-xs text-primary-600 hover:underline font-medium"
              >
                عرض الكل
              </Link>
            </div>
            <div className="space-y-3">
              {EXPERTS_PREVIEW.map((expert) => (
                <div
                  key={expert.name}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-300 to-blue-300 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {expert.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{expert.name}</p>
                    <p className="text-slate-400 text-xs">{expert.specialty}</p>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-0.5 text-yellow-400 text-xs">
                      <FaStar size={10} />
                      <span className="text-slate-600 font-medium">{expert.rating}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{expert.sessions} جلسة</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!user && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-slate-800 mb-2">ابدأ استشارتك اليوم</h3>
              <p className="text-slate-500 text-sm mb-4">
                سجل مجاناً وتواصل مع الخبراء الآن
              </p>
              <Link
                href="/register"
                className="block w-full py-2.5 bg-gradient-to-r from-primary-600 to-blue-500 text-white rounded-xl font-bold text-sm hover:shadow-md hover:opacity-90 transition-all"
              >
                سجل مجاناً
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
