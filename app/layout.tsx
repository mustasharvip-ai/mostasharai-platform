import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import AIConsultantBot from '@/components/AIConsultantBot';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'منصة مستشاري | الاستشارات المهنية العربية',
  description:
    'منصة مستشاري – ربطك بأفضل الخبراء والمستشارين في مجالات القانون، الطب، التقنية، الأعمال والمزيد.',
  keywords: 'استشارات, مستشار, خبير, محامي, طبيب, تقنية, أعمال, مستشاري',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-tajawal">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'Tajawal, sans-serif',
              direction: 'rtl',
            },
          }}
        />
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <AIConsultantBot />
      </body>
    </html>
  );
}
