# منصة مستشاري – Mostasharai Platform

منصة استشارات عربية احترافية مبنية بـ Next.js 14 مع App Router.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (RTL support, Tajawal font)
- **Database:** Firebase Firestore (real-time)
- **Auth:** Firebase Authentication (Email/Password)
- **Storage:** Firebase Storage (file uploads)
- **AI:** Google Gemini API (Arabic AI consultant bot)
- **Bot:** Telegram Bot API (admin management)
- **Package Manager:** npm

## Project Structure

```
app/
  (auth)/login/page.tsx       - Login page
  (auth)/register/page.tsx    - Registration page
  admin/page.tsx              - Admin dashboard (role: admin only)
  api/bot/route.ts            - Telegram bot webhook
  expert/[id]/page.tsx        - Expert profile & booking
  live/[id]/page.tsx          - Live streaming page (WebRTC skeleton)
  session/[id]/page.tsx       - Private consultation session
  wallet/page.tsx             - User wallet & balance requests
  layout.tsx                  - Root layout (RTL, Navbar, Bot)
  page.tsx                    - Home feed (posts)
  globals.css                 - Global styles + Tajawal font

components/
  AIConsultantBot.tsx         - Floating AI chat widget
  Navbar.tsx                  - Top navigation bar
  PostCard.tsx                - Social media post card

lib/
  firebase.ts                 - Firebase initialization
  gemini.ts                   - Gemini AI helper
  useAuth.ts                  - Auth + profile hook
```

## Running

```bash
npm run dev     # Development (port 5000)
npm run build   # Production build
npm start       # Production server
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in Firebase + Gemini keys.

## Key Features

1. Real-time social feed with posts, likes, comments
2. Arabic AI consultant bot (powered by Gemini)
3. User wallet with balance request system
4. Admin dashboard for managing users and balance requests
5. Expert profile pages with booking system
6. Live streaming skeleton (WebRTC/LiveKit ready)
7. Private consultation sessions with timer and cost calculation
8. Telegram bot for remote admin management
9. Full RTL Arabic UI with Tajawal font
