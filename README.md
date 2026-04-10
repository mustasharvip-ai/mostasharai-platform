# منصة مستشاري 🎯

منصة استشارات عربية احترافية تجمع بين ميزات التواصل الاجتماعي والاستشارات المهنية المدفوعة.

## ✨ الميزات الرئيسية

- **فيد اجتماعي** — منشورات، إعجابات، تعليقات بالوقت الفعلي
- **مساعد ذكي** — بوت مدعوم بـ Gemini AI للإجابة على الاستفسارات
- **محفظة إلكترونية** — إدارة الرصيد وطلبات الشحن
- **صفحة الخبير** — عرض الملف الشخصي وحجز الجلسات
- **بث مباشر** — هيكل جاهز لدمج WebRTC/LiveKit
- **جلسات خاصة** — تايمر وشات نصي وحساب التكلفة
- **لوحة تحكم** — إدارة المستخدمين وطلبات الشحن
- **بوت تليجرام** — إدارة المنصة عبر تليجرام

---

## 🚀 خطوات الإعداد

### 1. المتطلبات
- Node.js 18+
- حساب Firebase
- مفتاح Gemini AI (اختياري)
- بوت تليجرام (اختياري)

### 2. إعداد Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. أنشئ مشروعاً جديداً
3. فعّل الخدمات التالية:
   - **Authentication** → Email/Password
   - **Firestore Database** → قواعد الأمان (Development mode للبداية)
   - **Storage** → لرفع الصور
4. انسخ بيانات التهيئة من إعدادات المشروع

### 3. متغيرات البيئة

```bash
cp .env.local.example .env.local
```

افتح ملف `.env.local` وأضف مفاتيحك:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_GEMINI_API_KEY=...
ADMIN_TELEGRAM_BOT_TOKEN=...
ADMIN_TELEGRAM_CHAT_ID=...
```

### 4. التشغيل

```bash
npm install
npm run dev
```

سيعمل التطبيق على `http://localhost:5000`

---

## 🔧 إعداد قواعد Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.authorId;
    }
    match /balanceRequests/{reqId} {
      allow read, create: if request.auth != null;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 🤖 إعداد بوت تليجرام

1. تحدث مع [@BotFather](https://t.me/BotFather) وأنشئ بوتاً جديداً
2. احصل على `BOT_TOKEN`
3. احصل على `CHAT_ID` الخاص بك عبر [@userinfobot](https://t.me/userinfobot)
4. اضبط Webhook:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/bot"
```

### أوامر البوت
| الأمر | الوصف |
|-------|-------|
| `/stats` | إحصائيات المنصة |
| `/ban [userId]` | حظر مستخدم |
| `/unban [userId]` | رفع الحظر |
| `/setBalance [userId] [amount]` | تعيين رصيد |
| `/approveBalance [requestId]` | الموافقة على طلب شحن |
| `/help` | قائمة الأوامر |

---

## 👑 تعيين مدير أول

1. سجّل حساباً عبر `/register`
2. اذهب إلى Firestore → `users` → ابحث عن وثيقتك
3. غيّر `role` من `"user"` إلى `"admin"`

---

## 📁 هيكل المشروع

```
mostasharai-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── admin/page.tsx
│   ├── api/bot/route.ts
│   ├── expert/[id]/page.tsx
│   ├── live/[id]/page.tsx
│   ├── session/[id]/page.tsx
│   ├── wallet/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── AIConsultantBot.tsx
│   ├── Navbar.tsx
│   └── PostCard.tsx
├── lib/
│   ├── firebase.ts
│   ├── gemini.ts
│   └── useAuth.ts
└── .env.local.example
```

---

## 🛠️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| Next.js 14 (App Router) | إطار العمل الرئيسي |
| TypeScript | الأمان النوعي |
| Tailwind CSS | التصميم |
| Firebase Auth | المصادقة |
| Firestore | قاعدة البيانات |
| Firebase Storage | رفع الملفات |
| Gemini AI | المساعد الذكي |
| Telegram Bot API | إدارة عن بُعد |

---

## 📄 الترخيص

MIT License — للاستخدام الشخصي والتجاري.
