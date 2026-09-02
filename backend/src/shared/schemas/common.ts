import { z } from 'zod';
import { LOCALES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants.js';
import { CONTENT_STATUSES } from '../enums.js';

export const localeSchema = z.enum(LOCALES);
export const contentStatusSchema = z.enum(CONTENT_STATUSES);

/** URL-ga yaroqli slug: kichik harflar, raqamlar va tire. */
export const slugSchema = z
  .string()
  .min(2, 'Slug juda qisqa')
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug faqat kichik lotin harf, raqam va tiredan iborat bo‘lsin');

export const cuidSchema = z.string().min(1);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Matnni slug'ga aylantiradi. O'zbek lotin apostroflari (o‘, g‘) va kirill
 * harflari ham qo'llab-quvvatlanadi — admin RU sarlavhadan slug yaratsa ham ishlaydi.
 */
const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[‘’'`´]/g, '')
    .split('')
    .map((ch) => CYRILLIC_MAP[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** Ikki tilli matn maydoni — UZ majburiy, RU ixtiyoriy (admin keyin to'ldirishi mumkin). */
export function bilingualText(min: number, max: number) {
  return {
    uz: z.string().min(min).max(max),
    ru: z.string().max(max).optional().or(z.literal('')),
  };
}
