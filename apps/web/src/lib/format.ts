import type { Locale } from '@ayntravel/shared';

/** Narxni ko'rsatish: 800 → "800$", 1250.5 → "1 250$" */
export function formatPrice(value: number, currency = 'USD'): string {
  const rounded = Math.round(value);
  const grouped = rounded.toLocaleString('ru-RU').replace(/ /g, ' ');
  return currency === 'USD' ? `${grouped}$` : `${grouped} ${currency}`;
}

const MONTHS: Record<Locale, string[]> = {
  uz: [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
  ],
  ru: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ],
};

/**
 * "28-oktabr" / "28 октября" ko'rinishida — posterlardagidek.
 * `Intl` ishlatilmaydi, chunki o'zbek lotin lokali barcha muhitda mavjud emas.
 */
export function formatDate(iso: string | Date | null, locale: Locale, withYear = false): string {
  if (!iso) return '';
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '';

  const day = date.getUTCDate();
  const month = MONTHS[locale][date.getUTCMonth()];
  const year = date.getUTCFullYear();

  if (locale === 'uz') {
    return withYear ? `${day}-${month} ${year}` : `${day}-${month}`;
  }
  return withYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}

/** "7 kun / 6 kecha" — poster uslubi. */
export function formatDuration(
  days: number | null,
  nights: number | null,
  locale: Locale,
): string {
  if (!days && !nights) return '';
  const d = locale === 'uz' ? 'kun' : 'дн.';
  const n = locale === 'uz' ? 'kecha' : 'ноч.';
  if (days && nights) return `${days} ${d} / ${nights} ${n}`;
  return days ? `${days} ${d}` : `${nights} ${n}`;
}

/** Telefonni ko'rsatish uchun: +998915443160 → +998 91 544 31 60 */
export function displayPhone(e164: string): string {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

/** 25900 → "25.9K" — statistika bloklarida. */
export function compactNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(value);
}

/** Telefon inputiga maska: foydalanuvchi yozgan sari formatlaydi. */
export function maskUzPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  const parts = [local.slice(0, 2), local.slice(2, 5), local.slice(5, 7), local.slice(7, 9)];
  return `+998 ${parts.filter(Boolean).join(' ')}`.trimEnd();
}
