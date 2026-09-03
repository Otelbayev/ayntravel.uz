/** Sayt qo'llab-quvvatlaydigan tillar. `uz` — default, prefiksi ham bor (/uz). */
export const LOCALES = ['uz', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Instagram poster nisbatlari. Tur kartochkalari 4:5 da chiziladi —
 * bu ayntravel.uz lentasidagi posterlarning aynan formati.
 */
export const IMAGE_VARIANTS = {
  poster: { width: 1080, height: 1350 }, // 4:5 — IG portret
  square: { width: 1080, height: 1080 }, // 1:1 — IG kvadrat
  wide: { width: 1600, height: 900 }, // 16:9 — hero / OG
  thumb: { width: 400, height: 500 }, // 4:5 kichik
} as const;

export type ImageVariantName = keyof typeof IMAGE_VARIANTS;
export const IMAGE_FORMATS = ['avif', 'webp'] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

/** Yuklanadigan rasm uchun cheklovlar. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12MB
export const ALLOWED_UPLOAD_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

/**
 * Hero fon videosi uchun cheklovlar.
 *
 * 48MB — ataylab qattiq chegara: video multer'ning `memoryStorage` sida,
 * ya'ni butunlay RAM'da ushlanadi. Undan oshirish uchun `diskStorage` va
 * oqimli `storage.put` kerak bo'ladi.
 */
export const MAX_VIDEO_UPLOAD_BYTES = 48 * 1024 * 1024; // 48MB
export const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/webm'] as const;

/** Media turi — rasm yoki video. Prisma'dagi `MediaKind` enum bilan bir xil. */
export const MEDIA_KINDS = ['IMAGE', 'VIDEO'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/**
 * Hero slayd-shou chegaralari.
 *
 * 6 ta — bejiz emas: barcha slaydlar bir vaqtda DOM'ga chiziladi (krossfeyd
 * bo'sh to'rtburchakka tushmasligi uchun), shuning uchun soni cheklanishi kerak.
 */
export const HERO_MAX_SLIDES = 6;
export const HERO_MIN_INTERVAL_MS = 3000;
export const HERO_MAX_INTERVAL_MS = 20000;
export const HERO_DEFAULT_INTERVAL_MS = 6000;
export const HERO_DEFAULT_OVERLAY_OPACITY = 0.55;

/** Lid qaysi joydan kelganini bilish uchun. Admin panelda filtr sifatida ishlatiladi. */
export const LEAD_SOURCES = [
  'hero',
  'tour_page',
  'destination_page',
  'contact_page',
  'floating_cta',
  'blog',
  'other',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Sahifalash bo'yicha default qiymatlar. */
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 60;
