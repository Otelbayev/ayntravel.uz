import { z } from 'zod';
import { LEAD_SOURCES } from '../constants.js';
import { LEAD_STATUSES } from '../enums.js';
import { localeSchema, paginationSchema } from './common.js';

/**
 * O'zbekiston raqamini normalizatsiya qiladi.
 * "+998 (91) 544-31-60", "91 544 31 60", "998915443160" → "+998915443160".
 * Mos kelmasa null qaytaradi.
 */
export function normalizeUzPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let local: string;
  if (digits.length === 12 && digits.startsWith('998')) local = digits.slice(3);
  else if (digits.length === 9) local = digits;
  else if (digits.length === 13 && digits.startsWith('0998')) local = digits.slice(4);
  else return null;
  // Operator kodi 2 raqam, undan keyin 7 raqam. Kod 0/1 bilan boshlanmaydi.
  if (!/^[2-9]\d{8}$/.test(local)) return null;
  return `+998${local}`;
}

/** Ko'rsatish uchun chiroyli format: +998 91 544 31 60 */
export function formatUzPhone(e164: string): string {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

export const phoneSchema = z
  .string()
  .min(9, 'Telefon raqamini kiriting')
  .max(25)
  .transform((v, ctx) => {
    const normalized = normalizeUzPhone(v);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Telefon raqami noto‘g‘ri. Masalan: +998 90 123 45 67',
      });
      return z.NEVER;
    }
    return normalized;
  });

export const utmSchema = z
  .object({
    source: z.string().max(120).optional(),
    medium: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    content: z.string().max(120).optional(),
    term: z.string().max(120).optional(),
    referrer: z.string().max(500).optional(),
    landingPage: z.string().max(500).optional(),
  })
  .partial()
  .optional();

/**
 * Saytdagi ariza formasi. `website` — honeypot: haqiqiy foydalanuvchi uni
 * hech qachon ko'rmaydi, bot to'ldiradi. `renderedAt` — forma qachon
 * chizilgani; juda tez yuborilgan so'rov bot deb hisoblanadi.
 */
export const createLeadSchema = z.object({
  name: z.string().trim().min(2, 'Ismingizni kiriting').max(100),
  phone: phoneSchema,
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  tourId: z.string().optional(),
  source: z.enum(LEAD_SOURCES).default('other'),
  locale: localeSchema.default('uz'),
  utm: utmSchema,
  website: z.string().max(0, 'Spam aniqlandi').optional(), // honeypot
  renderedAt: z.coerce.number().int().positive().optional(),
});
export type CreateLeadInput = z.input<typeof createLeadSchema>;
export type CreateLeadPayload = z.output<typeof createLeadSchema>;

export const leadStatusSchema = z.enum(LEAD_STATUSES);

export const updateLeadSchema = z.object({
  status: leadStatusSchema.optional(),
  managerNote: z.string().max(2000).optional(),
});

export const leadQuerySchema = paginationSchema.extend({
  status: leadStatusSchema.optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  search: z.string().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
