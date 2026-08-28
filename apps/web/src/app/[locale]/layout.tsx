import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Locale } from '@ayntravel/shared';
import { routing } from '@/i18n/routing';
import { safeApi } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import { SITE_URL, travelAgencyJsonLd } from '@/lib/seo';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FloatingCta } from '@/components/layout/FloatingCta';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { JsonLd } from '@/components/seo/JsonLd';
import { Analytics } from '@/components/seo/Analytics';
import '../globals.css';

/**
 * Shriftlar `next/font` orqali self-host qilinadi: tashqi so'rov yo'q,
 * `font-display: swap` avtomatik, va CLS nolga teng.
 * Ikkalasi ham kirill alifbosini qo'llab-quvvatlaydi — ruscha versiya uchun shart.
 */
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

export const viewport: Viewport = {
  themeColor: '#071630',
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('defaultTitle'),
      // Ichki sahifalarda: "Turkiya turi | AYN TRAVEL"
      template: `%s | ${t('siteName')}`,
    },
    description: t('defaultDescription'),
    applicationName: 'AYN TRAVEL',
    authors: [{ name: 'AYN TRAVEL' }],
    creator: 'AYN TRAVEL',
    publisher: 'AYN TRAVEL',
    formatDetection: { telephone: true, address: true },
    icons: { icon: '/logo.jpg', apple: '/logo.jpg' },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      // Yandex O'zbekistonda Google'dan kam ahamiyatli emas
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Statik generatsiya uchun tilni oldindan belgilaymiz.
  setRequestLocale(locale);

  // Sozlamalar va yo'nalishlar shapka/futerda kerak. API o'chib qolsa ham
  // sayt ochilishi kerak — shuning uchun `safeApi` va bazaviy qiymatlar.
  const [settings, destinations] = await Promise.all([
    safeApi.settings(),
    safeApi.destinations(),
  ]);
  const site = settings ?? DEFAULT_SETTINGS;

  return (
    <html lang={locale} className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <MotionProvider>
            <SmoothScroll />

            {/* Klaviatura bilan yuruvchilar navigatsiyani o'tkazib yuborishi uchun */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-gold-500 focus:px-4 focus:py-2 focus:font-bold focus:text-navy-950"
            >
              {locale === 'ru' ? 'К основному содержанию' : 'Asosiy kontentga o‘tish'}
            </a>

            <Header phone={site.phonePrimary} />

            <main id="main">{children}</main>

            <Footer settings={site} destinations={destinations} locale={locale as Locale} />

            <FloatingCta phone={site.phonePrimary} telegram={site.telegramChannel} />

            <JsonLd data={travelAgencyJsonLd(site, locale as Locale)} />
            <Analytics />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
