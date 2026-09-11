import 'dotenv/config';
import crypto from 'node:crypto';
import { z } from 'zod';

/*
 * ── Vercel: qo'lda kiritiladigan maxfiy env'larsiz ishga tushish ──
 *
 * Neon ↔ Vercel integratsiyasi `DATABASE_URL` (pooler) va
 * `DATABASE_URL_UNPOOLED` ni o'zi qo'shadi, Blob store esa
 * `BLOB_READ_WRITE_TOKEN` ni. Qolgan sirlar qo'yilmagan bo'lsa, ular bitta
 * master sirdan (APP_SECRET, bo'lmasa Blob tokeni) HMAC-SHA256 bilan
 * yorliq bo'yicha hosil qilinadi: har biri alohida, barqaror (deploy'lar
 * orasida o'zgarmaydi) va master sirsiz qayta tiklab bo'lmaydi.
 * Env'da aniq qiymat berilsa — har doim o'sha ishlatiladi.
 * Frontend `/api/revalidate` ham REVALIDATE_SECRET ni aynan shu usulda hosil qiladi.
 */
export function deriveSecret(label: string): string | undefined {
  const master = process.env.APP_SECRET || process.env.BLOB_READ_WRITE_TOKEN;
  if (!master) return undefined;
  return crypto.createHmac('sha256', master).update(`ayntravel:${label}`).digest('base64url');
}

for (const [key, label] of [
  ['JWT_ACCESS_SECRET', 'jwt-access'],
  ['JWT_REFRESH_SECRET', 'jwt-refresh'],
  ['IP_HASH_SALT', 'ip-hash'],
  ['REVALIDATE_SECRET', 'revalidate'],
] as const) {
  if (!process.env[key]) {
    const derived = deriveSecret(label);
    if (derived) process.env[key] = derived;
  }
}

// Neon integratsiyasi nomlari → Prisma kutgan nomlar.
if (!process.env.DIRECT_URL && process.env.DATABASE_URL_UNPOOLED) {
  process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED;
}
// Pooler (pgbouncer) orqali ulanishda Prisma'ga buni aytish shart.
if (process.env.DATABASE_URL?.includes('-pooler.') && !process.env.DATABASE_URL.includes('pgbouncer=')) {
  const sep = process.env.DATABASE_URL.includes('?') ? '&' : '?';
  process.env.DATABASE_URL += `${sep}pgbouncer=true&connection_limit=1`;
}

/**
 * Barcha env o'zgaruvchilari shu yerda bir marta tekshiriladi.
 * Noto'g'ri konfiguratsiya server ishga tushishidayoq aniq xato bilan to'xtaydi —
 * ishlab turgan paytda kutilmagan `undefined` bo'lmaydi.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL kerak'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET kamida 32 belgi bo‘lsin'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET kamida 32 belgi bo‘lsin'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().default(30),

  /// Vergul bilan ajratilgan ruxsat etilgan originlar.
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().optional(),

  /// Saytning ommaviy manzili — ISR revalidation va Telegram linklari uchun.
  WEB_URL: z.string().url().default('http://localhost:3000'),
  REVALIDATE_SECRET: z.string().min(16).optional(),

  /// Fayl saqlash: local (disk), s3 (S3/R2/Spaces) yoki blob (Vercel Blob).
  STORAGE_DRIVER: z.enum(['local', 's3', 'blob']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  /// Rasmlar ochiq ko'rinadigan bazaviy URL (local uchun API manzili, s3 uchun CDN).
  ASSET_BASE_URL: z.string().default('http://localhost:4000/uploads'),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  /// Telegram: yangi lid kelganda menejerlarga xabar.
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  /// IP hash qilish uchun tuz — xom IP hech qachon bazaga yozilmaydi.
  IP_HASH_SALT: z.string().min(8).default('ayn-travel-dev-salt'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.superRefine((value, ctx) => {
  if (value.NODE_ENV !== 'production') return;
  if (value.IP_HASH_SALT === 'ayn-travel-dev-salt' || value.IP_HASH_SALT.length < 32) ctx.addIssue({ code: 'custom', path: ['IP_HASH_SALT'], message: 'Production requires a unique secret of at least 32 characters' });
  if (!value.REVALIDATE_SECRET) ctx.addIssue({ code: 'custom', path: ['REVALIDATE_SECRET'], message: 'Production requires REVALIDATE_SECRET' });
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) ctx.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'JWT secrets must be different' });
  if (process.env.VERCEL && value.STORAGE_DRIVER === 'local') ctx.addIssue({ code: 'custom', path: ['STORAGE_DRIVER'], message: 'Vercel requires durable Blob or S3 storage' });
  for (const url of [value.WEB_URL, ...value.CORS_ORIGINS.split(',').map((x) => x.trim()).filter(Boolean)]) {
    try { const parsedUrl = new URL(url); if (parsedUrl.protocol !== 'https:' || /^(localhost|127\.0\.0\.1)$/.test(parsedUrl.hostname)) throw new Error(); }
    catch { ctx.addIssue({ code: 'custom', path: ['WEB_URL', 'CORS_ORIGINS'], message: 'Production requires explicit public HTTPS origins' }); }
  }
}).safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  const message = `Env konfiguratsiyasi noto‘g‘ri:\n${issues}`;
  console.error(`\n❌ ${message}\n`);
  /*
   * `process.exit()` emas, `throw`.
   *
   * Serverless'da (Vercel) modul yuklanishi funksiya ichida sodir bo'ladi:
   * `exit` u yerda sababsiz "runtime crashed" beradi, throw esa xato matnini
   * loglarda ko'rsatadi. Node'da ishga tushganda ham natija bir xil —
   * ushlanmagan xato jarayonni to'xtatadi.
   */
  throw new Error(message);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
