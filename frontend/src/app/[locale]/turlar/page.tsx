import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SearchX } from 'lucide-react';
import type { Locale } from '@/shared';
import { api, safeApi } from '@/lib/api';
import { buildMetadata, breadcrumbJsonLd, SITE_URL } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { Section, SectionHeader } from '@/components/ui/Section';
import { RevealGroup } from '@/components/motion/Reveal';
import { TourGrid } from '@/components/home/TourGrid';
import { TourFilters } from '@/components/tour/TourFilters';
import { Pagination } from '@/components/ui/Pagination';
import { JsonLd } from '@/components/seo/JsonLd';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return buildMetadata({
    title: t('toursTitle'),
    description: t('toursDescription'),
    locale: locale as Locale,
    pathUz: '/turlar',
    pathRu: '/tury',
  });
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ToursPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const sp = await searchParams;
  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const t = await getTranslations('sections');
  const tf = await getTranslations('filters');

  const query = {
    page: Number(one('page') ?? 1) || 1,
    destination: one('destination'),
    minPrice: one('minPrice'),
    maxPrice: one('maxPrice'),
    nights: one('nights'),
    stars: one('stars'),
    hot: one('hot'),
    search: one('search'),
    sort: one('sort') ?? 'date_asc',
  };

  const [result, destinations] = await Promise.all([
    api.tours(query).catch(() => ({ items: [], page: 1, pageSize: 12, total: 0, totalPages: 1 })),
    safeApi.destinations(),
  ]);

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'AYN TRAVEL', url: `${SITE_URL}/${locale}` },
    {
      name: t('allTours'),
      url: `${SITE_URL}/${locale}${locale === 'ru' ? '/tury' : '/turlar'}`,
    },
  ]);

  return (
    <div className="pt-24 lg:pt-28">
      <Section>
        <SectionHeader
          title={t('allTours')}
          subtitle={tf('found', { count: result.total })}
        />

        <TourFilters destinations={destinations} locale={locale} />

        {result.items.length > 0 ? (
          <>
            <RevealGroup className="mt-8">
              <TourGrid tours={result.items} locale={locale} priorityCount={4} />
            </RevealGroup>

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              className="mt-12"
            />
          </>
        ) : (
          <div className="mt-12 flex flex-col items-center gap-3 py-16 text-center">
            <SearchX className="size-12 text-ink-subtle" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold text-ink">{tf('nothingFound')}</h2>
            <p className="max-w-md text-sm text-ink-muted">{tf('nothingFoundHint')}</p>
          </div>
        )}

        <JsonLd data={breadcrumbs} />
      </Section>
    </div>
  );
}
