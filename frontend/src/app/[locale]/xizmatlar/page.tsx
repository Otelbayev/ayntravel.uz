import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/shared';
import { EDITORIAL_SERVICES } from '@/lib/editorial';
import { api } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { DEFAULT_SETTINGS } from '@/lib/defaults';
import { Section, SectionHeader } from '@/components/ui/Section';
import { ServicesSection } from '@/components/home/ServicesSection';
import { ContactSection } from '@/components/home/ContactSection';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return buildMetadata({
    title: t('servicesTitle'),
    description: t('defaultDescription'),
    locale: locale as Locale,
    pathUz: '/xizmatlar',
    pathRu: '/uslugi',
  });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const t = await getTranslations('sections');
  const [services, settings] = await Promise.all([
    api.services().catch(() => []),
    api.settings().catch(() => DEFAULT_SETTINGS),
  ]);

  return (
    <div className="pt-24 lg:pt-28">
      <Section>
        <SectionHeader title={t('services')} subtitle={t('servicesSubtitle')} align="center" />
        <ServicesSection services={services.length ? services : EDITORIAL_SERVICES} locale={locale} />
      </Section>

      <Section className="bg-surface-sunken">
        <SectionHeader title={t('contact')} subtitle={t('contactSubtitle')} align="center" />
        <ContactSection settings={settings} locale={locale} />
      </Section>
    </div>
  );
}
