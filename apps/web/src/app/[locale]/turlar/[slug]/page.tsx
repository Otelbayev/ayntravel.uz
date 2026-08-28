import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Calendar, Check, Clock, MapPin, Star, Utensils, X } from 'lucide-react';
import type { Locale } from '@ayntravel/shared';
import { MEAL_PLAN_LABELS, pick, pickArray, pickExact } from '@ayntravel/shared';
import { api, ApiError, safeApi } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/format';
import {
  breadcrumbJsonLd,
  buildMetadata,
  localizedPath,
  SITE_URL,
  tourJsonLd,
} from '@/lib/seo';
import { Link, routing } from '@/i18n/routing';
import { SmartImage } from '@/components/ui/SmartImage';
import { Badge } from '@/components/ui/Badge';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Reveal, RevealGroup } from '@/components/motion/Reveal';
import { TourGrid } from '@/components/home/TourGrid';
import { TourPriceBox } from '@/components/tour/TourPriceBox';
import { JsonLd } from '@/components/seo/JsonLd';

/** Sahifalar talab bo'yicha generatsiya qilinadi va keyin keshda qoladi. */
export const dynamicParams = true;

/**
 * Barcha nashr etilgan turlar build paytida oldindan chiziladi: birinchi
 * tashrifchi ham, qidiruv roboti ham darhol tayyor HTML oladi.
 * Yangi tur qo'shilsa `dynamicParams` uni talab bo'yicha generatsiya qiladi.
 */
export async function generateStaticParams() {
  const data = await safeApi.sitemapData();
  return routing.locales.flatMap((locale) =>
    data.tours.map((tour) => ({ locale, slug: tour.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;

  try {
    const { tour } = await api.tour(slug);
    const record = tour as unknown as Record<string, unknown>;

    // SEO sarlavhasi shu tilda kiritilmagan bo'lsa, o'sha tildagi oddiy
    // sarlavhaga o'tamiz. Boshqa tilning sarlavhasini ko'rsatib bo'lmaydi:
    // ruscha sahifada o'zbekcha title Google uchun ham, mijoz uchun ham xato signal.
    const title = pickExact(record, 'seoTitle', locale) || pick(record, 'title', locale);
    const description =
      pickExact(record, 'seoDescription', locale) ||
      pick(record, 'summary', locale) ||
      `${pick(record, 'title', locale)} — ${tour.priceFrom}$`;

    return buildMetadata({
      title,
      description,
      locale,
      pathUz: `/turlar/${slug}`,
      pathRu: `/tury/${slug}`,
      // OG rasm sifatida turning Instagram posteri ishlatiladi —
      // u allaqachon professional dizayn qilingan.
      image: tour.posterImage,
    });
  } catch {
    return buildMetadata({
      title: 'Tur',
      description: '',
      locale,
      pathUz: `/turlar/${slug}`,
      pathRu: `/tury/${slug}`,
      noIndex: true,
    });
  }
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  let data;
  try {
    data = await api.tour(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const { tour, related } = data;
  const record = tour as unknown as Record<string, unknown>;

  const t = await getTranslations('tour');
  const tSections = await getTranslations('sections');

  const title = pick(record, 'title', locale);
  const summary = pick(record, 'summary', locale);
  const body = pick(record, 'body', locale);
  const cities = pickArray(record, 'cities', locale);
  const destination = tour.destination
    ? pick(tour.destination as unknown as Record<string, unknown>, 'name', locale)
    : null;

  const duration = formatDuration(tour.durationDays, tour.durationNights, locale);

  const facts = [
    tour.departureDate && {
      icon: Calendar,
      label: t('departure'),
      value: formatDate(tour.departureDate, locale, true),
    },
    duration && { icon: Clock, label: t('duration'), value: duration },
    tour.hotelStars && {
      icon: Star,
      label: t('hotel'),
      value: `${tour.hotelStars}★`,
    },
    tour.mealPlan && {
      icon: Utensils,
      label: t('meal'),
      value: `${tour.mealPlan} — ${MEAL_PLAN_LABELS[tour.mealPlan][locale]}`,
    },
    cities.length > 0 && { icon: MapPin, label: t('cities'), value: cities.join(' • ') },
  ].filter(Boolean) as { icon: typeof Calendar; label: string; value: string }[];

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'AYN TRAVEL', url: `${SITE_URL}/${locale}` },
    {
      name: tSections('allTours'),
      url: `${SITE_URL}/${locale}${localizedPath('/turlar', locale)}`,
    },
    {
      name: title,
      url: `${SITE_URL}/${locale}${localizedPath('/turlar/[slug]', locale, { slug })}`,
    },
  ]);

  return (
    <>
      <article className="pt-24 lg:pt-28">
        <div className="container-page py-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
            {/* Chap ustun — kontent */}
            <div>
              <Reveal>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {tour.isHot && <Badge variant="hot">🔥 {t('hot')}</Badge>}
                  {destination && (
                    <Link
                      href={{
                        pathname: '/yonalishlar/[slug]',
                        params: { slug: tour.destination!.slug },
                      }}
                    >
                      <Badge variant="outline">{destination}</Badge>
                    </Link>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl">{title}</h1>

                {summary && (
                  <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
                    {summary}
                  </p>
                )}
              </Reveal>

              {/* Poster — Instagram 4:5 formatida, asl ko'rinishida */}
              <Reveal delay={0.1} className="mt-8">
                <div className="relative mx-auto aspect-[4/5] max-w-lg overflow-hidden rounded-card border border-line">
                  <SmartImage
                    media={tour.posterImage}
                    variant="poster"
                    alt={title}
                    locale={locale}
                    priority
                    sizes="(max-width: 1024px) 92vw, 40vw"
                  />
                </div>
              </Reveal>

              {/* Asosiy ma'lumotlar */}
              {facts.length > 0 && (
                <Reveal delay={0.15} className="mt-8">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    {facts.map((fact) => (
                      <div key={fact.label} className="card-surface flex gap-3 p-4">
                        <fact.icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                        <div className="min-w-0">
                          <dt className="text-xs tracking-wide text-ink-subtle uppercase">
                            {fact.label}
                          </dt>
                          <dd className="font-semibold text-ink">{fact.value}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              )}

              {/* Dastur (admin kiritgan HTML) */}
              {body && (
                <Reveal delay={0.1} className="mt-10">
                  <h2 className="mb-4 text-2xl">{t('program')}</h2>
                  <div
                    className="prose-tour"
                    // Kontent faqat admin paneldan, ishonchli manbadan keladi.
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                </Reveal>
              )}

              {/* Kiradi / kirmaydi */}
              {(tour.includes.length > 0 || tour.excludes.length > 0) && (
                <Reveal delay={0.1} className="mt-10 grid gap-6 sm:grid-cols-2">
                  {tour.includes.length > 0 && (
                    <div className="card-surface p-5">
                      <h3 className="mb-3 font-display text-lg font-bold text-ink">
                        {t('includes')}
                      </h3>
                      <ul className="flex flex-col gap-2.5">
                        {tour.includes.map((item) => (
                          <li key={item} className="flex gap-2.5 text-sm text-ink-muted">
                            <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tour.excludes.length > 0 && (
                    <div className="card-surface p-5">
                      <h3 className="mb-3 font-display text-lg font-bold text-ink">
                        {t('excludes')}
                      </h3>
                      <ul className="flex flex-col gap-2.5">
                        {tour.excludes.map((item) => (
                          <li key={item} className="flex gap-2.5 text-sm text-ink-muted">
                            <X className="mt-0.5 size-4 shrink-0 text-hot-400" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Reveal>
              )}

              {/* Galereya */}
              {tour.gallery.length > 0 && (
                <Reveal delay={0.1} className="mt-10">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {tour.gallery.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square overflow-hidden rounded-xl border border-line"
                      >
                        <SmartImage
                          media={image}
                          variant="square"
                          locale={locale}
                          alt={title}
                          sizes="(max-width: 640px) 46vw, 30vw"
                        />
                      </div>
                    ))}
                  </div>
                </Reveal>
              )}
            </div>

            {/* O'ng ustun — scroll'da yopishib turadigan narx bloki */}
            <TourPriceBox tour={tour} />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <Section className="bg-surface-sunken">
          <SectionHeader title={tSections('relatedTours')} />
          <RevealGroup>
            <TourGrid tours={related} locale={locale} />
          </RevealGroup>
        </Section>
      )}

      {/* Product + Offer: Google natijalarda narxni ko'rsatadi */}
      <JsonLd data={[tourJsonLd(tour, locale), breadcrumbs]} />
    </>
  );
}
