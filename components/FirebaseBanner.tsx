'use client';

export default function FirebaseBanner() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
        <div className="text-5xl mb-4">🔧</div>
        <h2 className="text-xl font-extrabold text-amber-800 mb-3">
          المنصة بحاجة إلى إعداد Firebase
        </h2>
        <p className="text-amber-700 text-sm leading-relaxed mb-5">
          لتشغيل المنصة بالكامل، تحتاج إلى إضافة مفاتيح Firebase و Gemini AI.
          انسخ ملف <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local.example</code> إلى{' '}
          <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code>{' '}
          وأضف مفاتيحك.
        </p>
        <div className="bg-white rounded-xl p-4 text-right border border-amber-100">
          <p className="text-xs font-mono text-slate-600 leading-relaxed whitespace-pre-wrap">{`NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key`}</p>
        </div>
        <p className="text-amber-600 text-xs mt-4">
          راجع ملف <strong>README.md</strong> لتعليمات الإعداد الكاملة
        </p>
      </div>
    </div>
  );
}
