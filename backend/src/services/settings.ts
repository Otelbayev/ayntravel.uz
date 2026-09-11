import type {
  HeroBackgroundConfig,
  MediaDTO,
  ResolvedHeroBackground,
  ResolvedHeroVideo,
  SiteSettings,
} from '../shared/index.js';
import { heroBackgroundSchema } from '../shared/index.js';
import { prisma } from '../db.js';
import { mediaSelect, toMedia } from './dto.js';

/** Hero foni saqlanadigan yagona sozlama kaliti. */
export const HERO_BACKGROUND_KEY = 'heroBackground';

/**
 * Server hisoblab qo'shadigan, lekin HECH QACHON bazaga yozilmaydigan kalitlar.
 * Admin formasi butun sozlamalar obyektini qaytarib yuboradi, shuning uchun
 * ularni yozishdan oldin ajratib tashlash shart.
 */
const DERIVED_KEYS = new Set(['heroBackgroundResolved']);

const DEFAULT_HERO_BACKGROUND: HeroBackgroundConfig = {
  mode: 'gradient',
  slideIds: [],
  videoSource: 'none',
  videoMediaId: null,
  videoUrl: '',
  videoPosterId: null,
  intervalMs: 6000,
  kenBurns: true,
  overlayOpacity: 0.55,
};

/**
 * Sayt sozlamalarining bazaviy qiymatlari — AYN TRAVEL ning haqiqiy ma'lumotlari.
 * Bazada yozuv bo'lmasa shular ishlatiladi, ya'ni sayt seed'siz ham to'g'ri ishlaydi.
 * Admin panelda o'zgartirilgan qiymat bazadagisi bilan ustiga yoziladi.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  phonePrimary: '+998915443160',
  phoneSecondary: '+998772696767',
  managerMadinaPhone: '+998772696767',
  managerUmidPhone: '+998915443160',
  telegramChannel: 'https://t.me/ayn_travel',
  telegramAdmin: 'https://t.me/ayntravel01',
  instagram: 'https://www.instagram.com/ayntravel.uz/',
  email: 'info@ayntravel.uz',
  addressUz: 'Toshkent sh., Shota Rustaveli ko‘chasi, 136/2',
  addressRu: 'г. Ташкент, улица Шота Руставели, 136/2',
  mapUrl: 'https://yandex.uz/maps/-/CTHanBlc',
  mapEmbedUrl: '',
  workingHoursUz: 'Dushanba–Shanba: 09:00–18:00',
  workingHoursRu: 'Понедельник–Суббота: 09:00–18:00',
  heroTitleUz: 'Dunyo kutmoqda. Siz tayyormisiz?',
  heroTitleRu: 'Мир ждёт. Вы готовы?',
  heroSubtitleUz: 'Okean sokinligidan yangi shaharlar shukuhigacha. Siz orzu qiling, sayohat tafsilotlarini bizga qoldiring.',
  heroSubtitleRu: 'От тишины океана до ритма новых городов. Мечтайте, а детали путешествия доверьте нам.',
  heroBackground: DEFAULT_HERO_BACKGROUND,
  stats: { toursCount: 120, clientsCount: 5000, followersCount: 25900, yearsCount: 5 },
  defaultOgImage: null,
};

/** Bazadagi key/value juftlarini bitta obyektga yig'adi. */
export async function getSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as SiteSettings;
}

export async function updateSettings(patch: Record<string, unknown>): Promise<SiteSettings> {
  const entries = Object.entries(patch).filter(([key]) => !DERIVED_KEYS.has(key));
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value as never },
        update: { value: value as never },
      }),
    ),
  );
  return getSettingsResolved();
}

// ── Hero foni ────────────────────────────────────────────────

/**
 * Bazadagi xom JSON'ni to'liq va xavfsiz obyektga keltiradi.
 *
 * NIMA UCHUN MAJBURIY: `getSettings()` sayoz merge qiladi, ya'ni bazadagi
 * `heroBackground` obyekti standartni BUTUNLAY almashtiradi. Kelajakda yangi
 * maydon qo'shilsa eski qatorlarda u `undefined` bo'lib qoladi. Zod sxemasining
 * har maydonida `.default()` bor — shu tufayli chala JSON ham to'liq bo'lib chiqadi.
 *
 * Ya'ni `settings.heroBackground` hech qachon to'g'ridan o'qilmaydi.
 */
export function normalizeHeroBackground(raw: unknown): HeroBackgroundConfig {
  const parsed = heroBackgroundSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : DEFAULT_HERO_BACKGROUND;
}

/** Sozlamalarda havola qilingan barcha media id'lari (tartibsiz, takrorsiz). */
export function heroMediaIdsOf(cfg: HeroBackgroundConfig): string[] {
  const ids = [...cfg.slideIds, cfg.videoPosterId, cfg.videoMediaId].filter(
    (id): id is string => Boolean(id),
  );
  return [...new Set(ids)];
}

function gradientOnly(cfg: HeroBackgroundConfig): ResolvedHeroBackground {
  return {
    mode: 'gradient',
    slides: [],
    video: null,
    videoMedia: null,
    poster: null,
    intervalMs: cfg.intervalMs,
    kenBurns: cfg.kenBurns,
    overlayOpacity: cfg.overlayOpacity,
  };
}

/**
 * Media id'larini to'liq `MediaDTO` obyektlariga aylantiradi.
 *
 * Slaydlar tartibi `slideIds` bo'yicha tiklanadi — Prisma `in` so'rovi tartibni
 * saqlamaydi, shuning uchun Map orqali qayta yig'iladi.
 */
export async function resolveHeroBackground(
  settings: SiteSettings,
): Promise<ResolvedHeroBackground> {
  const cfg = normalizeHeroBackground(settings.heroBackground);
  const ids = heroMediaIdsOf(cfg);

  // Media umuman tanlanmagan bo'lsa bazaga bormaymiz — bu funksiya har bir
  // `/api/home` so'rovida ishlaydi va ishlatilmasa mutlaqo tekin bo'lishi kerak.
  if (ids.length === 0) return gradientOnly(cfg);

  const rows = await prisma.media.findMany({ where: { id: { in: ids } }, select: mediaSelect });
  const byId = new Map<string, MediaDTO>();
  for (const row of rows) {
    const dto = toMedia(row);
    if (dto) byId.set(dto.id, dto);
  }

  const slides = cfg.slideIds
    .map((id) => byId.get(id))
    .filter((m): m is MediaDTO => Boolean(m) && m!.kind === 'IMAGE');

  const posterFromId = cfg.videoPosterId ? byId.get(cfg.videoPosterId) : undefined;
  const poster = (posterFromId?.kind === 'IMAGE' ? posterFromId : undefined) ?? slides[0] ?? null;

  let video: ResolvedHeroVideo | null = null;
  let videoMedia: MediaDTO | null = null;
  if (cfg.videoMediaId) {
    const row = byId.get(cfg.videoMediaId);
    if (row?.kind === 'VIDEO') videoMedia = row;
  }

  if (cfg.videoSource === 'upload' && videoMedia?.sourceUrl) {
    video = { src: videoMedia.sourceUrl, mimeType: videoMedia.mimeType, origin: 'upload' };
  } else if (cfg.videoSource === 'url' && cfg.videoUrl) {
    video = {
      src: cfg.videoUrl,
      mimeType: /\.webm(\?|$)/i.test(cfg.videoUrl) ? 'video/webm' : 'video/mp4',
      origin: 'url',
    };
  }

  // Himoyalangan degradatsiya: media o'chirilgan yoki havola buzilgan bo'lsa
  // hero oq bo'lib qolmasligi, shunchaki gradientga tushishi kerak.
  let mode = cfg.mode;
  if (mode === 'video' && !video) mode = slides.length > 0 ? 'slideshow' : 'gradient';
  if (mode === 'slideshow' && slides.length === 0) mode = 'gradient';

  return {
    mode,
    slides,
    video,
    videoMedia,
    poster,
    intervalMs: cfg.intervalMs,
    kenBurns: cfg.kenBurns,
    overlayOpacity: cfg.overlayOpacity,
  };
}

/**
 * `getSettings()` + hisoblangan hero foni.
 *
 * Ommaviy `/api/home`, `/api/settings` va admin `GET /api/admin/settings` shuni
 * chaqiradi. `getSettings()` ning o'zi toza qoladi (xom JSON, xom id'lar) —
 * u yozishdan keyin ham chaqiriladi va u yerda join ortiqcha bo'lardi.
 */
export async function getSettingsResolved(): Promise<SiteSettings> {
  const settings = await getSettings();
  return { ...settings, heroBackgroundResolved: await resolveHeroBackground(settings) };
}

/**
 * Media id sozlamalarda ishlatilganmi.
 *
 * `DELETE /api/admin/media/:id` uchun: relationlar bo'yicha sanoq bu havolani
 * ko'rmaydi, chunki u JSON ichida yotadi. Bu — maslahat darajasidagi himoya,
 * haqiqiy tashqi kalit emas.
 */
export async function isMediaUsedInSettings(mediaId: string): Promise<boolean> {
  const row = await prisma.siteSetting.findUnique({ where: { key: HERO_BACKGROUND_KEY } });
  if (!row) return false;
  return heroMediaIdsOf(normalizeHeroBackground(row.value)).includes(mediaId);
}
