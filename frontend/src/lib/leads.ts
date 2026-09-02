import type { LeadDTO } from '@/shared';

/**
 * Arizalar bilan ishlaydigan umumiy yordamchilar.
 *
 * Ro'yxat sahifasi (`/admin/leads`) va kartochka sahifasi
 * (`/admin/leads/[id]`) ikkalasi ham shulardan foydalanadi — manba nomlari
 * va sana formati ikki joyda bir-biridan farq qilib qolmasligi uchun.
 */

/** Ariza saytning qaysi qismidan kelgani. */
export const SOURCE_LABELS: Record<string, string> = {
  hero: 'Bosh sahifa',
  tour_page: 'Tur sahifasi',
  destination_page: 'Yo‘nalish sahifasi',
  contact_page: 'Aloqa sahifasi',
  floating_cta: 'Suzuvchi tugma',
  blog: 'Blog',
  other: 'Boshqa',
};

export const sourceLabel = (source: string) => SOURCE_LABELS[source] ?? source;

/** Toshkent vaqti bo'yicha to'liq sana va soat. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** «2 soat oldin» ko'rinishidagi nisbiy vaqt — menejer tezligini baholash uchun. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return 'hozirgina';
  if (minutes < 60) return `${minutes} daqiqa oldin`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} kun oldin`;

  return formatDateTime(iso);
}

/** Telegram'da raqam bo'yicha suhbat ochish havolasi. */
export const telegramLink = (phone: string) => `https://t.me/${phone.replace('+', '')}`;

/** UTM ma'lumotini inson o'qiydigan qatorlarga aylantiradi. */
export function utmRows(lead: LeadDTO): { label: string; value: string }[] {
  if (!lead.utm) return [];

  const LABELS: Record<string, string> = {
    source: 'Manba',
    medium: 'Kanal',
    campaign: 'Kampaniya',
    content: 'Kontent',
    term: 'So‘rov',
    referrer: 'Qayerdan o‘tgan',
    landingPage: 'Birinchi sahifa',
  };

  return Object.entries(lead.utm)
    .filter(([, value]) => typeof value === 'string' && value.length > 0)
    .map(([key, value]) => ({ label: LABELS[key] ?? key, value: String(value) }));
}
