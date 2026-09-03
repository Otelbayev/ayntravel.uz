import type {
  Locale,
  ImageVariantName,
  ImageFormat,
  LeadSource,
  MediaKind,
} from './constants.js';
import type { ContentStatus, LeadStatus, MealPlan, UserRole } from './enums.js';

/** API har doim shu konvertda javob qaytaradi. */
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string[]> };
};
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Bitta rasmning barcha variantlari: variants[nom][format] = URL */
export type MediaVariants = Partial<Record<ImageVariantName, Partial<Record<ImageFormat, string>>>>;

export interface MediaDTO {
  id: string;
  kind: MediaKind;
  /** Rasm uchun poster/webp, video uchun `sourceUrl`. */
  url: string;
  /** Faqat video uchun — xom fayl URL'i. Rasmda har doim `null`. */
  sourceUrl: string | null;
  /** `<source type="...">` uchun kerak. */
  mimeType: string | null;
  /** Video uchun bo'sh obyekt — `variants` faqat rasm shartnomasi. */
  variants: MediaVariants;
  width: number;
  height: number;
  /** Video davomiyligi (soniya). Brauzer o'lchaydi — serverda ffmpeg yo'q. */
  durationSeconds: number | null;
  blurDataUrl: string | null;
  altUz: string | null;
  altRu: string | null;
}

export interface DestinationDTO {
  id: string;
  slug: string;
  nameUz: string;
  nameRu: string | null;
  countryCode: string | null;
  descriptionUz: string | null;
  descriptionRu: string | null;
  heroImage: MediaDTO | null;
  sortOrder: number;
  tourCount?: number;
  minPrice?: number | null;
  seoTitleUz: string | null;
  seoTitleRu: string | null;
  seoDescriptionUz: string | null;
  seoDescriptionRu: string | null;
  updatedAt: string;
}

export interface TourDTO {
  id: string;
  slug: string;
  titleUz: string;
  titleRu: string | null;
  summaryUz: string | null;
  summaryRu: string | null;
  bodyUz: string | null;
  bodyRu: string | null;
  destination: Pick<DestinationDTO, 'id' | 'slug' | 'nameUz' | 'nameRu' | 'countryCode'> | null;
  priceFrom: number;
  extraFee: number | null;
  currency: string;
  departureDate: string | null;
  returnDate: string | null;
  durationDays: number | null;
  durationNights: number | null;
  hotelStars: number | null;
  mealPlan: MealPlan | null;
  citiesUz: string[];
  citiesRu: string[];
  includes: string[];
  excludes: string[];
  posterImage: MediaDTO | null;
  gallery: MediaDTO[];
  isHot: boolean;
  isFeatured: boolean;
  seatsLeft: number | null;
  status: ContentStatus;
  publishedAt: string | null;
  viewCount: number;
  seoTitleUz: string | null;
  seoTitleRu: string | null;
  seoDescriptionUz: string | null;
  seoDescriptionRu: string | null;
  updatedAt: string;
}

export interface PostDTO {
  id: string;
  slug: string;
  titleUz: string;
  titleRu: string | null;
  excerptUz: string | null;
  excerptRu: string | null;
  bodyUz: string | null;
  bodyRu: string | null;
  coverImage: MediaDTO | null;
  category: string | null;
  tags: string[];
  readingTime: number;
  status: ContentStatus;
  publishedAt: string | null;
  seoTitleUz: string | null;
  seoTitleRu: string | null;
  seoDescriptionUz: string | null;
  seoDescriptionRu: string | null;
  updatedAt: string;
}

export interface ServiceDTO {
  id: string;
  slug: string;
  icon: string | null;
  titleUz: string;
  titleRu: string | null;
  descriptionUz: string | null;
  descriptionRu: string | null;
  sortOrder: number;
}

export interface FaqDTO {
  id: string;
  questionUz: string;
  questionRu: string | null;
  answerUz: string;
  answerRu: string | null;
  sortOrder: number;
}

export interface TestimonialDTO {
  id: string;
  clientName: string;
  textUz: string;
  textRu: string | null;
  rating: number;
  photo: MediaDTO | null;
  tour: { slug: string; titleUz: string; titleRu: string | null } | null;
}

export interface PageDTO {
  id: string;
  slug: string;
  titleUz: string;
  titleRu: string | null;
  bodyUz: string | null;
  bodyRu: string | null;
  seoTitleUz: string | null;
  seoTitleRu: string | null;
  seoDescriptionUz: string | null;
  seoDescriptionRu: string | null;
  updatedAt: string;
}

export interface LeadDTO {
  id: string;
  name: string;
  phone: string;
  message: string | null;
  source: LeadSource;
  locale: Locale;
  status: LeadStatus;
  managerNote: string | null;
  utm: Record<string, string> | null;
  tour: { id: string; slug: string; titleUz: string } | null;
  createdAt: string;
  contactedAt: string | null;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// ── Hero foni ────────────────────────────────────────────────

export type HeroBackgroundMode = 'gradient' | 'slideshow' | 'video';
export type HeroVideoSource = 'none' | 'upload' | 'url';

/**
 * Bosh ekran foni — adminda sozlanadi, bazada bitta `heroBackground`
 * kalitida JSON bo'lib yotadi.
 */
export interface HeroBackgroundConfig {
  mode: HeroBackgroundMode;
  /** Massiv tartibi = slaydlarning ko'rsatilish tartibi. */
  slideIds: string[];
  videoSource: HeroVideoSource;
  /** `kind: 'VIDEO'` bo'lgan Media id. */
  videoMediaId: string | null;
  /** Tashqi mp4/webm havola. */
  videoUrl: string;
  /** `kind: 'IMAGE'` — video rejimida LCP elementi, shuning uchun majburiy. */
  videoPosterId: string | null;
  intervalMs: number;
  kenBurns: boolean;
  /** 0..0.9 — matn kontrasti uchun qora parda quyuqligi. */
  overlayOpacity: number;
}

export interface ResolvedHeroVideo {
  src: string;
  mimeType: string | null;
  origin: 'upload' | 'url';
}

/** Server id'larni to'liq obyektga aylantirgan holat. Bazaga hech qachon yozilmaydi. */
export interface ResolvedHeroBackground {
  mode: HeroBackgroundMode;
  slides: MediaDTO[];
  video: ResolvedHeroVideo | null;
  /** Yuklangan video media yozuvi — admin formasi thumbnail chizishi uchun. */
  videoMedia: MediaDTO | null;
  poster: MediaDTO | null;
  intervalMs: number;
  kenBurns: boolean;
  overlayOpacity: number;
}

/** Sayt sozlamalari — kod tegmasdan admin paneldan o'zgartiriladi. */
export interface SiteSettings {
  phonePrimary: string;
  phoneSecondary: string;
  managerMadinaPhone: string;
  managerUmidPhone: string;
  telegramChannel: string;
  telegramAdmin: string;
  instagram: string;
  email: string;
  addressUz: string;
  addressRu: string;
  mapUrl: string;
  mapEmbedUrl: string;
  workingHoursUz: string;
  workingHoursRu: string;
  heroTitleUz: string;
  heroTitleRu: string;
  heroSubtitleUz: string;
  heroSubtitleRu: string;
  /**
   * DIQQAT: bu maydonni HECH QACHON to'g'ridan o'qimang.
   *
   * `getSettings()` sayoz merge qiladi (`{...DEFAULT_SETTINGS, ...stored}`),
   * ya'ni bazadagi obyekt standartni butunlay almashtiradi — kelajakda yangi
   * maydon qo'shilsa eski qatorlarda u `undefined` bo'ladi. Har doim
   * `normalizeHeroBackground()` orqali o'qing.
   */
  heroBackground: HeroBackgroundConfig;
  /** Faqat o'qish uchun — server qo'shadi, PUT'da yuborilmaydi va saqlanmaydi. */
  heroBackgroundResolved?: ResolvedHeroBackground;
  stats: { toursCount: number; clientsCount: number; followersCount: number; yearsCount: number };
  defaultOgImage: string | null;
  [key: string]: unknown;
}

/** Sitemap uchun minimal ma'lumot — barcha nashr etilgan URL'lar. */
export interface SitemapEntry {
  slug: string;
  updatedAt: string;
}
export interface SitemapData {
  tours: SitemapEntry[];
  posts: SitemapEntry[];
  destinations: SitemapEntry[];
  pages: SitemapEntry[];
}

/** Admin dashboard uchun yig'ma raqamlar. */
export interface DashboardStats {
  leadsToday: number;
  leadsWeek: number;
  leadsMonth: number;
  leadsByStatus: Record<LeadStatus, number>;
  recentLeads: LeadDTO[];
  topTours: { id: string; slug: string; titleUz: string; viewCount: number; leadCount: number }[];
  totals: { tours: number; posts: number; destinations: number };
}

/**
 * Ikki tilli obyektdan joriy tilga mos qiymatni oladi.
 * RU bo'sh bo'lsa UZ'ga qaytadi — admin tarjimani hali kiritmagan bo'lishi mumkin.
 */
export function pick<T extends Record<string, unknown>>(
  obj: T,
  base: string,
  locale: Locale,
): string {
  const suffix = locale === 'ru' ? 'Ru' : 'Uz';
  const value = obj[`${base}${suffix}`];
  if (typeof value === 'string' && value.trim().length > 0) return value;
  const fallback = obj[`${base}Uz`];
  return typeof fallback === 'string' ? fallback : '';
}

/**
 * `pick` dan farqi: boshqa tilga QAYTMAYDI.
 *
 * SEO sarlavhalari uchun shart. `pick` ishlatilsa `seoTitleRu` bo'sh bo'lganda
 * ruscha sahifaga o'zbekcha sarlavha tushib qoladi — bu Google uchun ham,
 * foydalanuvchi uchun ham xato signal. Bo'sh qaytarilsa, chaqiruvchi
 * o'sha tildagi oddiy sarlavhaga o'tadi.
 */
export function pickExact<T extends Record<string, unknown>>(
  obj: T,
  base: string,
  locale: Locale,
): string {
  const suffix = locale === 'ru' ? 'Ru' : 'Uz';
  const value = obj[`${base}${suffix}`];
  return typeof value === 'string' && value.trim().length > 0 ? value : '';
}

/** `pick` ning massivlar uchun varianti (citiesUz / citiesRu). */
export function pickArray<T extends Record<string, unknown>>(
  obj: T,
  base: string,
  locale: Locale,
): string[] {
  const suffix = locale === 'ru' ? 'Ru' : 'Uz';
  const value = obj[`${base}${suffix}`];
  if (Array.isArray(value) && value.length > 0) return value as string[];
  const fallback = obj[`${base}Uz`];
  return Array.isArray(fallback) ? (fallback as string[]) : [];
}
