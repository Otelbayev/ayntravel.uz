import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/shared';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import { Section, SectionHeader } from '@/components/ui/Section';
import { ContactSection } from '@/components/home/ContactSection';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return buildMetadata({
    title: t('contactTitle'),
    description: t('defaultDescription'),
    locale: locale as Locale,
    pathUz: '/aloqa',
    pathRu: '/kontakty',
  });
}

export default async function ContactPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ destination?: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const destination = (await searchParams).destination;
  const initialMessage = typeof destination === 'string' ? `${locale === 'ru' ? 'Интересует путешествие: ' : 'Sayohatga qiziqyapman: '}${destination.slice(0, 100)}` : undefined;
  const t = await getTranslations('sections');
  const settings = await api.settings().catch(() => DEFAULT_SETTINGS);

  return (
    <div className="pt-24 lg:pt-28">
      <Section>
        <SectionHeader title={t('contact')} subtitle={t('contactSubtitle')} align="center" />
        <ContactSection settings={settings} locale={locale} initialMessage={initialMessage} />
      </Section>
    </div>
  );
}
