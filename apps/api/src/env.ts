import 'dotenv/config';
import { z } from 'zod';

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

  /// Fayl saqlash: local (disk) yoki s3 (S3/R2/Spaces).
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
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

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`\n❌ Env konfiguratsiyasi noto‘g‘ri:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
