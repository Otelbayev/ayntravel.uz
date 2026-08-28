import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@ayntravel/shared';
import { routing } from '@/i18n/routing';
import { StaticPage, staticPageMetadata } from '@/components/StaticPage';

const SLUG = 'ommaviy-oferta';
const PATHS = { uz: '/ommaviy-oferta', ru: '/oferta' };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return staticPageMetadata(SLUG, locale as Locale, PATHS);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <StaticPage slug={SLUG} locale={locale as Locale} />;
}
