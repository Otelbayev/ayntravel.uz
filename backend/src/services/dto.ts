import type { Prisma } from '@prisma/client';
import type {
  DestinationDTO,
  FaqDTO,
  LeadDTO,
  MediaDTO,
  MediaVariants,
  PageDTO,
  PostDTO,
  ServiceDTO,
  TestimonialDTO,
  TourDTO,
  UserDTO,
} from '../shared/index.js';

/**
 * Prisma yozuvlarini API DTO'lariga o'giradi.
 *
 * Ikki narsa majburiy: `Decimal` → `number` (JSON'da Decimal obyekt bo'lib
 * ketadi) va `Date` → ISO satr. Shu qatlam bo'lmasa frontend'da narx
 * `{ s: 1, e: 2, d: [800] }` ko'rinishida keladi.
 */

const iso = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);
const num = (d: Prisma.Decimal | null | undefined): number | null =>
  d === null || d === undefined ? null : Number(d);

export const mediaSelect = {
  id: true,
  variants: true,
  width: true,
  height: true,
  blurDataUrl: true,
  altUz: true,
  altRu: true,
} satisfies Prisma.MediaSelect;

type MediaRow = Prisma.MediaGetPayload<{ select: typeof mediaSelect }>;

export function toMedia(row: MediaRow | null | undefined): MediaDTO | null {
  if (!row) return null;
  const variants = (row.variants ?? {}) as MediaVariants;
  // Asosiy URL — 4:5 webp: eng ko'p ishlatiladigan va hamma joyda qo'llab-quvvatlanadi.
  const url =
    variants.poster?.webp ??
    variants.square?.webp ??
    variants.wide?.webp ??
    variants.thumb?.webp ??
    '';
  return {
    id: row.id,
    url,
    variants,
    width: row.width,
    height: row.height,
    blurDataUrl: row.blurDataUrl,
    altUz: row.altUz,
    altRu: row.altRu,
  };
}

export const destinationInclude = {
  heroImage: { select: mediaSelect },
} satisfies Prisma.DestinationInclude;

export function toDestination(
  row: Prisma.DestinationGetPayload<{ include: typeof destinationInclude }> & {
    _count?: { tours: number };
    minPrice?: Prisma.Decimal | null;
  },
): DestinationDTO {
  return {
    id: row.id,
    slug: row.slug,
    nameUz: row.nameUz,
    nameRu: row.nameRu,
    countryCode: row.countryCode,
    descriptionUz: row.descriptionUz,
    descriptionRu: row.descriptionRu,
    heroImage: toMedia(row.heroImage),
    sortOrder: row.sortOrder,
    tourCount: row._count?.tours,
    minPrice: num(row.minPrice ?? null),
    seoTitleUz: row.seoTitleUz,
    seoTitleRu: row.seoTitleRu,
    seoDescriptionUz: row.seoDescriptionUz,
    seoDescriptionRu: row.seoDescriptionRu,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const tourInclude = {
  destination: {
    select: { id: true, slug: true, nameUz: true, nameRu: true, countryCode: true },
  },
  posterImage: { select: mediaSelect },
  gallery: {
    orderBy: { sortOrder: 'asc' },
    include: { media: { select: mediaSelect } },
  },
} satisfies Prisma.TourInclude;

export function toTour(row: Prisma.TourGetPayload<{ include: typeof tourInclude }>): TourDTO {
  return {
    id: row.id,
    slug: row.slug,
    titleUz: row.titleUz,
    titleRu: row.titleRu,
    summaryUz: row.summaryUz,
    summaryRu: row.summaryRu,
    bodyUz: row.bodyUz,
    bodyRu: row.bodyRu,
    destination: row.destination,
    priceFrom: Number(row.priceFrom),
    extraFee: num(row.extraFee),
    currency: row.currency,
    departureDate: iso(row.departureDate),
    returnDate: iso(row.returnDate),
    durationDays: row.durationDays,
    durationNights: row.durationNights,
    hotelStars: row.hotelStars,
    mealPlan: row.mealPlan,
    citiesUz: row.citiesUz,
    citiesRu: row.citiesRu,
    includes: row.includes,
    excludes: row.excludes,
    posterImage: toMedia(row.posterImage),
    gallery: row.gallery.map((g) => toMedia(g.media)).filter((m): m is MediaDTO => m !== null),
    isHot: row.isHot,
    isFeatured: row.isFeatured,
    seatsLeft: row.seatsLeft,
    status: row.status,
    publishedAt: iso(row.publishedAt),
    viewCount: row.viewCount,
    seoTitleUz: row.seoTitleUz,
    seoTitleRu: row.seoTitleRu,
    seoDescriptionUz: row.seoDescriptionUz,
    seoDescriptionRu: row.seoDescriptionRu,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const postInclude = {
  coverImage: { select: mediaSelect },
} satisfies Prisma.PostInclude;

export function toPost(row: Prisma.PostGetPayload<{ include: typeof postInclude }>): PostDTO {
  return {
    id: row.id,
    slug: row.slug,
    titleUz: row.titleUz,
    titleRu: row.titleRu,
    excerptUz: row.excerptUz,
    excerptRu: row.excerptRu,
    bodyUz: row.bodyUz,
    bodyRu: row.bodyRu,
    coverImage: toMedia(row.coverImage),
    category: row.category,
    tags: row.tags,
    readingTime: row.readingTime,
    status: row.status,
    publishedAt: iso(row.publishedAt),
    seoTitleUz: row.seoTitleUz,
    seoTitleRu: row.seoTitleRu,
    seoDescriptionUz: row.seoDescriptionUz,
    seoDescriptionRu: row.seoDescriptionRu,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toService(row: Prisma.ServiceGetPayload<object>): ServiceDTO {
  return {
    id: row.id,
    slug: row.slug,
    icon: row.icon,
    titleUz: row.titleUz,
    titleRu: row.titleRu,
    descriptionUz: row.descriptionUz,
    descriptionRu: row.descriptionRu,
    sortOrder: row.sortOrder,
  };
}

export function toFaq(row: Prisma.FaqGetPayload<object>): FaqDTO {
  return {
    id: row.id,
    questionUz: row.questionUz,
    questionRu: row.questionRu,
    answerUz: row.answerUz,
    answerRu: row.answerRu,
    sortOrder: row.sortOrder,
  };
}

export const testimonialInclude = {
  photo: { select: mediaSelect },
  tour: { select: { slug: true, titleUz: true, titleRu: true } },
} satisfies Prisma.TestimonialInclude;

export function toTestimonial(
  row: Prisma.TestimonialGetPayload<{ include: typeof testimonialInclude }>,
): TestimonialDTO {
  return {
    id: row.id,
    clientName: row.clientName,
    textUz: row.textUz,
    textRu: row.textRu,
    rating: row.rating,
    photo: toMedia(row.photo),
    tour: row.tour,
  };
}

export function toPage(row: Prisma.PageGetPayload<object>): PageDTO {
  return {
    id: row.id,
    slug: row.slug,
    titleUz: row.titleUz,
    titleRu: row.titleRu,
    bodyUz: row.bodyUz,
    bodyRu: row.bodyRu,
    seoTitleUz: row.seoTitleUz,
    seoTitleRu: row.seoTitleRu,
    seoDescriptionUz: row.seoDescriptionUz,
    seoDescriptionRu: row.seoDescriptionRu,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const leadInclude = {
  tour: { select: { id: true, slug: true, titleUz: true } },
} satisfies Prisma.LeadInclude;

export function toLead(row: Prisma.LeadGetPayload<{ include: typeof leadInclude }>): LeadDTO {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    message: row.message,
    source: row.source as LeadDTO['source'],
    locale: row.locale as LeadDTO['locale'],
    status: row.status,
    managerNote: row.managerNote,
    utm: (row.utm as Record<string, string> | null) ?? null,
    tour: row.tour,
    createdAt: row.createdAt.toISOString(),
    contactedAt: iso(row.contactedAt),
  };
}

export function toUser(row: Prisma.UserGetPayload<object>): UserDTO {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.isActive,
    lastLoginAt: iso(row.lastLoginAt),
    createdAt: row.createdAt.toISOString(),
  };
}
