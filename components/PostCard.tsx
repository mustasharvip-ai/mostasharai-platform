'use client';

import { useState } from 'react';
import Image from 'next/image';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaEllipsisH,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  likes: string[];
  commentsCount: number;
  createdAt: { seconds: number; nanoseconds: number } | Date;
}

function formatDate(createdAt: Post['createdAt']): string {
  const date =
    createdAt instanceof Date
      ? createdAt
      : new Date((createdAt as { seconds: number }).seconds * 1000);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'منذ لحظات';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const isLiked = user ? likes.includes(user.uid) : false;
  const [localLikes, setLocalLikes] = useState<string[]>(likes);
  const [liking, setLiking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً للتفاعل مع المنشورات');
      return;
    }
    if (liking) return;

    setLiking(true);
    const postRef = doc(db, 'posts', post.id);
    const currentlyLiked = localLikes.includes(user.uid);

    try {
      if (currentlyLiked) {
        setLocalLikes((prev) => prev.filter((id) => id !== user.uid));
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      } else {
        setLocalLikes((prev) => [...prev, user.uid]);
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
      }
    } catch {
      setLocalLikes(likes);
      toast.error('حدث خطأ أثناء التفاعل مع المنشور');
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `منشور من ${post.authorName}`,
        text: post.content.slice(0, 100),
        url: window.location.href,
      });
    } catch {
      toast.success('تم نسخ الرابط!');
    }
  };

  const isLocallyLiked = user ? localLikes.includes(user.uid) : false;
  const shortContent = post.content.slice(0, 200);
  const isLong = post.content.length > 200;

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden card-hover">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
            {post.authorAvatar ? (
              <Image
                src={post.authorAvatar}
                alt={post.authorName}
                width={44}
                height={44}
                className="rounded-full object-cover"
              />
            ) : (
              post.authorName?.[0]?.toUpperCase() || 'م'
            )}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{post.authorName}</p>
            <p className="text-slate-400 text-xs">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <FaEllipsisH size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-slate-700 text-sm leading-relaxed">
          {expanded || !isLong ? post.content : shortContent}
          {isLong && !expanded && '...'}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary-600 text-xs font-medium mt-1 hover:underline"
          >
            {expanded ? 'عرض أقل' : 'قراءة المزيد'}
          </button>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="relative w-full aspect-[16/9] bg-slate-100">
          <Image
            src={post.imageUrl}
            alt="صورة المنشور"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between px-5 py-2 text-xs text-slate-400 border-t border-slate-50">
        <span>
          {localLikes.length > 0 && (
            <>
              <span className="text-red-500">♥</span> {localLikes.length} إعجاب
            </>
          )}
        </span>
        <span>
          {post.commentsCount > 0 && `${post.commentsCount} تعليق`}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-slate-100 px-2">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl mx-1 text-sm font-medium transition-all ${
            isLocallyLiked
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
          } disabled:opacity-50`}
        >
          {isLocallyLiked ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
          إعجاب
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl mx-1 text-sm font-medium text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-all">
          <FaComment size={15} />
          تعليق
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl mx-1 text-sm font-medium text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all"
        >
          <FaShare size={15} />
          مشاركة
        </button>
      </div>
    </article>
  );
}
