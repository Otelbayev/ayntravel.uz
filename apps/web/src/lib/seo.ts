import type { Metadata } from 'next';
import type {
  DestinationDTO,
  FaqDTO,
  Locale,
  MediaDTO,
  PostDTO,
  SiteSettings,
  TourDTO,
} from '@ayntravel/shared';
import { pick } from '@ayntravel/shared';
import { routing } from '@/i18n/routing';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ayntravel.uz').replace(
  /\/+$/,
  '',
);

/** Ikkala tildagi manzillarni `alternates.languages` uchun yig'adi. */
export function localeAlternates(pathUz: string, pathRu: string) {
  return {
    languages: {
      uz: `${SITE_URL}/uz${pathUz}`,
      ru: `${SITE_URL}/ru${pathRu}`,
      'x-default': `${SITE_URL}/uz${pathUz}`,
    },
  };
}

interface MetaInput {
  title: string;
  description: string;
  locale: Locale;
  pathUz: string;
  pathRu: string;
  image?: MediaDTO | null;
  type?: 'website' | 'article';
  publishedTime?: string | null;
  noIndex?: boolean;
}

/**
 * Barcha sahifalar uchun yagona metadata quruvchi.
 * OG rasm sifatida turning Instagram posteri ishlatiladi — u allaqachon
 * professional dizayn qilingan va Telegram'da ulashilganda ideal ko'rinadi.
 */
export function buildMetadata({
  title,
  description,
  locale,
  pathUz,
  pathRu,
  image,
  type = 'website',
  publishedTime,
  noIndex,
}: MetaInput): Metadata {
  const path = locale === 'ru' ? pathRu : pathUz;
  const canonical = `${SITE_URL}/${locale}${path}`;
  const ogImage = image?.variants.wide?.webp ?? image?.variants.poster?.webp ?? image?.url;

  return {
    title,
    description,
    alternates: { canonical, ...localeAlternates(pathUz, pathRu) },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type,
      title,
      description,
      url: canonical,
      siteName: 'AYN TRAVEL',
      locale: locale === 'ru' ? 'ru_RU' : 'uz_UZ',
      alternateLocale: locale === 'ru' ? 'uz_UZ' : 'ru_RU',
      ...(publishedTime ? { publishedTime } : {}),
      ...(ogImage
        ? { images: [{ url: ogImage, width: 1600, height: 900, alt: title }] }
        : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/** URL'ni til bo'yicha yasaydi (routing.pathnames bilan mos). */
export function localizedPath(
  key: keyof typeof routing.pathnames,
  locale: Locale,
  params?: Record<string, string>,
): string {
  const entry = routing.pathnames[key];
  let path: string = typeof entry === 'string' ? entry : entry[locale];
  if (params) {
    for (const [k, v] of Object.entries(params)) path = path.replace(`[${k}]`, v);
  }
  return path;
}

// ─────────────────────────────────────────────────────────────
// JSON-LD (schema.org)
// ─────────────────────────────────────────────────────────────

/**
 * Kompaniya kartochkasi. Google va Yandex "AYN TRAVEL" so'rovida
 * telefon, manzil va ijtimoiy tarmoqlarni to'g'ridan-to'g'ri ko'rsatadi.
 */
export function travelAgencyJsonLd(settings: SiteSettings | null, locale: Locale) {
  const address = settings
    ? locale === 'ru'
      ? settings.addressRu
      : settings.addressUz
    : 'Toshkent, Shota Rustaveli 136/2';

  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#organization`,
    name: 'AYN TRAVEL',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpg`,
    image: `${SITE_URL}/logo.jpg`,
    description:
      locale === 'ru'
        ? 'Туристическая компания в Ташкенте: туры, авиабилеты, отели, визовая поддержка.'
        : 'Toshkentdagi turizm kompaniyasi: turlar, aviachiptalar, mehmonxonalar, viza yordami.',
    telephone: [settings?.phonePrimary, settings?.phoneSecondary].filter(Boolean),
    email: settings?.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: locale === 'ru' ? 'Ташкент' : 'Toshkent',
      addressCountry: 'UZ',
    },
    openingHours: 'Mo-Sa 09:00-18:00',
    priceRange: '$$',
    sameAs: [settings?.instagram, settings?.telegramChannel].filter(Boolean),
    hasMap: settings?.mapUrl,
  };
}

/**
 * Tur uchun Product + Offer. Aynan shu blok tufayli Google natijalarida
 * turning narxi ko'rinadi — bu bosilish darajasini sezilarli oshiradi.
 */
export function tourJsonLd(tour: TourDTO, locale: Locale) {
  const title = pick(tour as unknown as Record<string, unknown>, 'title', locale);
  const description = pick(tour as unknown as Record<string, unknown>, 'summary', locale);
  const path = localizedPath('/turlar/[slug]', locale, { slug: tour.slug });
  const image = tour.posterImage?.variants.poster?.webp ?? tour.posterImage?.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description,
    ...(image ? { image: [image] } : {}),
    brand: { '@type': 'Brand', name: 'AYN TRAVEL' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/${locale}${path}`,
      price: tour.priceFrom,
      priceCurrency: tour.currency,
      availability:
        tour.seatsLeft === 0
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
      ...(tour.departureDate
        ? { validThrough: tour.departureDate }
        : {}),
      seller: { '@type': 'TravelAgency', name: 'AYN TRAVEL', '@id': `${SITE_URL}/#organization` },
    },
  };
}

export function blogPostingJsonLd(post: PostDTO, locale: Locale) {
  const title = pick(post as unknown as Record<string, unknown>, 'title', locale);
  const description = pick(post as unknown as Record<string, unknown>, 'excerpt', locale);
  const image = post.coverImage?.variants.wide?.webp ?? post.coverImage?.url;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    ...(image ? { image: [image] } : {}),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'AYN TRAVEL', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'AYN TRAVEL', '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}/${locale}/blog/${post.slug}`,
  };
}

export function destinationJsonLd(destination: DestinationDTO, locale: Locale) {
  const name = pick(destination as unknown as Record<string, unknown>, 'name', locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name,
    description: pick(destination as unknown as Record<string, unknown>, 'description', locale),
    url: `${SITE_URL}/${locale}${localizedPath('/yonalishlar/[slug]', locale, { slug: destination.slug })}`,
    ...(destination.heroImage ? { image: destination.heroImage.url } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(faqs: FaqDTO[], locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: pick(faq as unknown as Record<string, unknown>, 'question', locale),
      acceptedAnswer: {
        '@type': 'Answer',
        text: pick(faq as unknown as Record<string, unknown>, 'answer', locale),
      },
    })),
  };
}
