import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/admin/Toast';
import { ConfirmProvider } from '@/components/admin/ConfirmDialog';
import '../globals.css';

const manrope = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * Admin panel ochiq saytdan mustaqil: o'z `<html>` tegi, o'z layouti va
 * til prefiksi yo'q. Panel faqat o'zbek tilida — undan kompaniyaning
 * o'z menejerlari foydalanadi, ko'p tillilik bu yerda ortiqcha yuk bo'lardi.
 */
export const metadata: Metadata = {
  title: 'Admin — AYN TRAVEL',
  // Panel hech qachon qidiruvga tushmasligi kerak.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="bg-surface-sunken">
        {/*
          Xabarlar va tasdiqlash oynasi butun panel uchun bitta joyda.
          Har bir sahifa `useToast()` / `useConfirm()` orqali foydalanadi.
        */}
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
