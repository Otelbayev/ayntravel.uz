import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/shared';
import { pick, pickExact } from '@/shared';
import { api, ApiError, isApiUnreachable, isBuildPhase, safeApi } from '@/lib/api';
import {
  breadcrumbJsonLd,
  buildMetadata,
  destinationJsonLd,
  localizedPath,
  SITE_URL,
} from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { Section, SectionHeader } from '@/components/ui/Section';
import { SmartImage } from '@/components/ui/SmartImage';
import { Pagination } from '@/components/ui/Pagination';
import { RevealGroup } from '@/components/motion/Reveal';
import { TourGrid } from '@/components/home/TourGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { LeadForm } from '@/components/forms/LeadForm';

/**
 * Yo'nalish landingi — SEO uchun eng qimmatli sahifa turi.
 * "Turkiyaga tur narxi", "Dubay turlari" kabi so'rovlar aynan shu
 * sahifalarga tushadi.
 */
/**
 * Yo'nalish landinglari — SEO uchun eng muhim sahifalar, hammasi oldindan chiziladi.
 *
 * Yengil `nav` endpointidan olinadi: `sitemap-data` barcha tur, maqola va
 * sahifa slug'larini ham tortadi — bu yerda ularning hojati yo'q.
 */
export async function generateStaticParams() {
  const destinations = await safeApi.destinationsNav();
  return routing.locales.flatMap((locale) =>
    destinations.map((destination) => ({ locale, slug: destination.slug })),
  );
}

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;

  try {
    const { destination, tours } = await api.destination(slug);
    const record = destination as unknown as Record<string, unknown>;
    const name = pick(record, 'name', locale);
    // Narx va son butun to'plamdan keladi (bitta sahifadan emas) — bosh
    // sahifadagi "$X dan" bilan qarama-qarshi bo'lmasligi uchun.
    const minPrice = destination.minPrice ?? null;
    const total = tours.total;

    const fallbackTitle =
      locale === 'ru'
        ? `Туры в ${name}${minPrice ? ` от ${minPrice}$` : ''} из Ташкента`
        : `${name} turlari${minPrice ? ` — ${minPrice}$ dan` : ''} | Toshkentdan`;

    const fallbackDescription =
      locale === 'ru'
        ? `Туры в ${name} из Ташкента. ${total} предложений, перелёт, отель и трансфер включены. Бронирование по телефону +998 91 544 31 60.`
        : `Toshkentdan ${name} yo‘nalishiga turlar. ${total} ta taklif, aviachipta, mehmonxona va transfer kiritilgan. Bron: +998 91 544 31 60.`;

    return buildMetadata({
      title: pickExact(record, 'seoTitle', locale) || fallbackTitle,
      description: pickExact(record, 'seoDescription', locale) || fallbackDescription,
      locale,
      pathUz: `/yonalishlar/${slug}`,
      pathRu: `/napravleniya/${slug}`,
      image: destination.heroImage,
    });
  } catch {
    return buildMetadata({
      title: 'Yo‘nalish',
      description: '',
      locale,
      pathUz: `/yonalishlar/${slug}`,
      pathRu: `/napravleniya/${slug}`,
      noIndex: true,
    });
  }
}

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const page = Math.max(1, Number((await searchParams).page) || 1);

  let data;
  try {
    data = await api.destination(slug, page);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();

    /*
     * API'ga umuman yetib bo'lmadi (server o'chiq, tarmoq nosozligi).
     *
     * Build paytida bu OQIBATSIZ bo'lishi kerak: frontend'ni yig'ish uchun
     * backend ishlab turishi shart emas. Aks holda `npm run build` butunlay
     * to'xtaydi. Sahifa 404 sifatida yig'iladi va API ko'tarilgach ISR
     * uni o'zi qayta chizadi.
     *
     * Ishlash paytida esa xato yashirilmaydi — haqiqiy nosozlikni ko'rish kerak.
     */
    if (isApiUnreachable(err) && isBuildPhase) notFound();

    throw err;
  }

  const { destination, tours } = data;
  const record = destination as unknown as Record<string, unknown>;
  const name = pick(record, 'name', locale);
  const description = pick(record, 'description', locale);

  const t = await getTranslations('sections');
  const tf = await getTranslations('filters');

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'AYN TRAVEL', url: `${SITE_URL}/${locale}` },
    {
      name: t('destinations'),
      url: `${SITE_URL}/${locale}${localizedPath('/yonalishlar', locale)}`,
    },
    {
      name,
      url: `${SITE_URL}/${locale}${localizedPath('/yonalishlar/[slug]', locale, { slug })}`,
    },
  ]);

  return (
    <>
      {/* Hero */}
      {/* Hero fon rasmi ustida — to'q rejim */}
      <header
        data-tone="dark"
        className="relative flex min-h-[52vh] items-end overflow-hidden bg-navy-950 pt-24 pb-12 lg:min-h-[60vh]"
      >
        <div className="absolute inset-0">
          <SmartImage
            media={destination.heroImage}
            variant="wide"
            alt={name}
            locale={locale}
            priority
            sizes="100vw"
          />
          <div className="overlay-gradient absolute inset-0" />
        </div>

        {/*
          Ataylab `Reveal` ichida EMAS: Motion `initial="hidden"` ni SSR HTML'ga
          `opacity: 0` bo'lib yozadi va sahifaning eng katta matni gidratatsiya
          tugaguncha ko'rinmay turadi — bu to'g'ridan LCP'ni kechiktiradi.
        */}
        <div className="container-page relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl">
            <span className="text-gold-gradient">{name}</span>
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/80 sm:text-lg">
              {description}
            </p>
          )}
          <p className="mt-4 text-sm font-semibold text-accent">
            {tf('found', { count: tours.total })}
          </p>
        </div>
      </header>

      <Section>
        {tours.items.length > 0 ? (
          <>
            <RevealGroup>
              {/* Hero rasmi allaqachon `priority` — grid u bilan raqobatlashmasin */}
              <TourGrid tours={tours.items} locale={locale} />
            </RevealGroup>
            <Pagination page={tours.page} totalPages={tours.totalPages} className="mt-12" />
          </>
        ) : (
          <div className="py-12 text-center">
            <h2 className="font-display text-xl font-bold text-ink">{tf('nothingFound')}</h2>
            <p className="mt-2 text-sm text-ink-muted">{tf('nothingFoundHint')}</p>
          </div>
        )}
      </Section>

      <Section className="bg-surface-sunken">
        <SectionHeader title={t('contact')} subtitle={t('contactSubtitle')} align="center" />
        <div className="card-surface mx-auto max-w-lg p-6 sm:p-8">
          <LeadForm source="destination_page" phone="+998915443160" />
        </div>
      </Section>

      <JsonLd data={[destinationJsonLd(destination, locale), breadcrumbs]} />
    </>
  );
}
