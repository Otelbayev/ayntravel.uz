/*
 * ┌─────────────────────────────────────────────────────────────┐
 * │  AVTOMATIK NUSXA — BU FAYLNI TAHRIRLAMANG                   │
 * │                                                             │
 * │  Asosiy nusxa:  backend/src/shared/constants.ts            
 * │  Yangilash:     node sync-shared.mjs                        │
 * └─────────────────────────────────────────────────────────────┘
 */

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
