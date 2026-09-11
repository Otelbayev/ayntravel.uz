import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/shared';
import { TravelInspiration } from '@/components/home/TravelInspiration';
import { safeApi } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import { breadcrumbJsonLd, buildMetadata, SITE_URL } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { Section, SectionHeader } from '@/components/ui/Section';
import { DestinationsSection } from '@/components/home/DestinationsSection';
import { ContactSection } from '@/components/home/ContactSection';
import { JsonLd } from '@/components/seo/JsonLd';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return buildMetadata({
    title: t('destinationsTitle'),
    description: t('destinationsDescription'),
    locale: locale as Locale,
    pathUz: '/yonalishlar',
    pathRu: '/napravleniya',
  });
}

/**
 * Yo'nalishlar ro'yxati.
 *
 * Bu sahifa alohida landinglar uchun "ota" sahifa: u yerdagi
 * `BreadcrumbList` shu manzilga ishora qiladi va ichki havolalar
 * yo'nalish sahifalarining qidiruvdagi vaznini oshiradi.
 */
export default async function DestinationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations('sections');
  const [destinations, settings] = await Promise.all([
    safeApi.destinations(),
    safeApi.settings(),
  ]);

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'AYN TRAVEL', url: `${SITE_URL}/${locale}` },
    {
      name: t('destinations'),
      url: `${SITE_URL}/${locale}/${locale === 'ru' ? 'napravleniya' : 'yonalishlar'}`,
    },
  ]);

  return (
    <div className="pt-24 lg:pt-28">
      <Section>
        <SectionHeader
          eyebrow={t('destinations')}
          title={t('destinationsSubtitle')}
          align="center"
        />
        {/* Birinchi qator ekranda ko'rinadi — faqat ularni oldindan yuklaymiz */}
        {destinations.length ? <DestinationsSection destinations={destinations} locale={locale} priorityCount={4} /> : <TravelInspiration locale={locale} />}
      </Section>

      <Section className="bg-surface-sunken">
        <SectionHeader title={t('contact')} subtitle={t('contactSubtitle')} align="center" />
        <ContactSection settings={settings ?? DEFAULT_SETTINGS} locale={locale} />
      </Section>

      <JsonLd data={breadcrumbs} />
    </div>
  );
}
