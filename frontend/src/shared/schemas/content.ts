/*
 * ┌─────────────────────────────────────────────────────────────┐
 * │  AVTOMATIK NUSXA — BU FAYLNI TAHRIRLAMANG                   │
 * │                                                             │
 * │  Asosiy nusxa:  backend/src/shared/schemas/content.ts      
 * │  Yangilash:     node sync-shared.mjs                        │
 * └─────────────────────────────────────────────────────────────┘
 */

import { z } from 'zod';
import { contentStatusSchema, slugSchema, paginationSchema } from './common';
import { MEAL_PLANS } from '../enums';
import {
  HERO_DEFAULT_INTERVAL_MS,
  HERO_DEFAULT_OVERLAY_OPACITY,
  HERO_MAX_INTERVAL_MS,
  HERO_MAX_SLIDES,
  HERO_MIN_INTERVAL_MS,
  MEDIA_KINDS,
} from '../constants';

/** Har bir nashr etiladigan model uchun umumiy SEO maydonlari. */
const seoFields = {
  seoTitleUz: z.string().max(180).optional().or(z.literal('')),
  seoTitleRu: z.string().max(180).optional().or(z.literal('')),
  seoDescriptionUz: z.string().max(400).optional().or(z.literal('')),
  seoDescriptionRu: z.string().max(400).optional().or(z.literal('')),
};

export const destinationSchema = z.object({
  slug: slugSchema,
  nameUz: z.string().trim().min(2).max(120),
  nameRu: z.string().trim().max(120).optional().or(z.literal('')),
  countryCode: z.string().length(2).toUpperCase().optional().or(z.literal('')),
  descriptionUz: z.string().max(6000).optional().or(z.literal('')),
  descriptionRu: z.string().max(6000).optional().or(z.literal('')),
  heroImageId: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  ...seoFields,
});

export const tourSchema = z.object({
  slug: slugSchema,
  titleUz: z.string().trim().min(3, 'Sarlavha kerak').max(200),
  titleRu: z.string().trim().max(200).optional().or(z.literal('')),
  summaryUz: z.string().max(500).optional().or(z.literal('')),
  summaryRu: z.string().max(500).optional().or(z.literal('')),
  bodyUz: z.string().max(50000).optional().or(z.literal('')),
  bodyRu: z.string().max(50000).optional().or(z.literal('')),

  destinationId: z.string().min(1, 'Yo‘nalishni tanlang'),

  priceFrom: z.coerce.number().min(0, 'Narx manfiy bo‘lmasin').max(1_000_000),
  extraFee: z.coerce.number().min(0).max(1_000_000).optional().nullable(),
  currency: z.string().length(3).toUpperCase().default('USD'),

  departureDate: z.coerce.date().optional().nullable(),
  returnDate: z.coerce.date().optional().nullable(),
  durationDays: z.coerce.number().int().min(1).max(60).optional().nullable(),
  durationNights: z.coerce.number().int().min(0).max(60).optional().nullable(),

  hotelStars: z.coerce.number().int().min(1).max(5).optional().nullable(),
  mealPlan: z.enum(MEAL_PLANS).optional().nullable(),

  citiesUz: z.array(z.string().max(80)).max(20).default([]),
  citiesRu: z.array(z.string().max(80)).max(20).default([]),
  includes: z.array(z.string().max(200)).max(30).default([]),
  excludes: z.array(z.string().max(200)).max(30).default([]),

  posterImageId: z.string().optional().nullable(),
  galleryImageIds: z.array(z.string()).max(30).default([]),

  isHot: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  seatsLeft: z.coerce.number().int().min(0).max(999).optional().nullable(),

  status: contentStatusSchema.default('DRAFT'),
  ...seoFields,
});
export type TourInput = z.input<typeof tourSchema>;

export const postSchema = z.object({
  slug: slugSchema,
  titleUz: z.string().trim().min(3).max(200),
  titleRu: z.string().trim().max(200).optional().or(z.literal('')),
  excerptUz: z.string().max(500).optional().or(z.literal('')),
  excerptRu: z.string().max(500).optional().or(z.literal('')),
  bodyUz: z.string().max(100000).optional().or(z.literal('')),
  bodyRu: z.string().max(100000).optional().or(z.literal('')),
  coverImageId: z.string().optional().nullable(),
  category: z.string().max(60).optional().or(z.literal('')),
  tags: z.array(z.string().max(40)).max(15).default([]),
  status: contentStatusSchema.default('DRAFT'),
  ...seoFields,
});

export const serviceSchema = z.object({
  slug: slugSchema,
  icon: z.string().max(40).optional().or(z.literal('')),
  titleUz: z.string().trim().min(2).max(120),
  titleRu: z.string().trim().max(120).optional().or(z.literal('')),
  descriptionUz: z.string().max(4000).optional().or(z.literal('')),
  descriptionRu: z.string().max(4000).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const faqSchema = z.object({
  questionUz: z.string().trim().min(3).max(300),
  questionRu: z.string().trim().max(300).optional().or(z.literal('')),
  answerUz: z.string().trim().min(3).max(4000),
  answerRu: z.string().max(4000).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const testimonialSchema = z.object({
  clientName: z.string().trim().min(2).max(100),
  textUz: z.string().trim().min(5).max(2000),
  textRu: z.string().max(2000).optional().or(z.literal('')),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  photoId: z.string().optional().nullable(),
  tourId: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const pageSchema = z.object({
  slug: slugSchema,
  titleUz: z.string().trim().min(2).max(200),
  titleRu: z.string().trim().max(200).optional().or(z.literal('')),
  bodyUz: z.string().max(100000).optional().or(z.literal('')),
  bodyRu: z.string().max(100000).optional().or(z.literal('')),
  ...seoFields,
});

export const mediaUpdateSchema = z.object({
  altUz: z.string().max(300).optional().or(z.literal('')),
  altRu: z.string().max(300).optional().or(z.literal('')),
});

/** Media ro'yxatini turi bo'yicha filtrlash — picker rasm yoki videoni ko'rsatadi. */
export const mediaQuerySchema = paginationSchema.extend({
  kind: z.enum(MEDIA_KINDS).optional(),
});

/**
 * Hero foni.
 *
 * HAR BIR maydonda `.default()` bor — bu ataylab: bazadagi eski yoki chala
 * JSON `safeParse` dan to'liq obyekt bo'lib chiqishi kerak
 * (`normalizeHeroBackground()` shunga tayanadi).
 */
export const heroBackgroundSchema = z.object({
  mode: z.enum(['gradient', 'slideshow', 'video']).default('gradient'),
  slideIds: z.array(z.string().min(1).max(40)).max(HERO_MAX_SLIDES).default([]),
  videoSource: z.enum(['none', 'upload', 'url']).default('none'),
  videoMediaId: z.string().min(1).max(40).nullable().default(null),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\/.+\.(mp4|webm)(\?.*)?$/i.test(v), {
      message: 'Video havolasi .mp4 yoki .webm bilan tugashi kerak',
    })
    .default(''),
  videoPosterId: z.string().min(1).max(40).nullable().default(null),
  intervalMs: z.coerce
    .number()
    .int()
    .min(HERO_MIN_INTERVAL_MS)
    .max(HERO_MAX_INTERVAL_MS)
    .default(HERO_DEFAULT_INTERVAL_MS),
  kenBurns: z.boolean().default(true),
  overlayOpacity: z.coerce.number().min(0).max(0.9).default(HERO_DEFAULT_OVERLAY_OPACITY),
});

/** Sozlamalar — erkin key/value. Qiymat har qanday JSON bo'lishi mumkin. */
export const siteSettingSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
});

/**
 * Ommaviy saqlash. Qolgan kalitlar erkin, lekin `heroBackground` — tuzilmali
 * obyekt, shuning uchun u yozilishidan oldin tekshiriladi.
 */
export const siteSettingsBulkSchema = z
  .record(z.string().max(80), z.unknown())
  .superRefine((obj, ctx) => {
    if (obj.heroBackground === undefined) return;
    const parsed = heroBackgroundSchema.safeParse(obj.heroBackground);
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['heroBackground'],
        message: parsed.error.issues[0]?.message ?? 'Hero foni noto‘g‘ri',
      });
    }
  });

/** Ochiq turlar ro'yxati uchun filtrlar (/turlar sahifasi). */
export const tourQuerySchema = paginationSchema.extend({
  destination: z.string().max(120).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  nights: z.coerce.number().int().min(0).max(60).optional(),
  stars: z.coerce.number().int().min(1).max(5).optional(),
  hot: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().max(120).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'date_asc', 'date_desc', 'newest', 'popular']).default('date_asc'),
});
export type TourQuery = z.infer<typeof tourQuerySchema>;
