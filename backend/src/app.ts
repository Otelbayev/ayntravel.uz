import path from 'node:path';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { corsOrigins, env, isProd } from './env.js';
import { logger } from './logger.js';
import { publicRouter } from './routes/public/index.js';
import { adminRouter } from './routes/admin/index.js';
import { authRouter } from './routes/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { purgeExpiredTokens } from './services/tokens.js';

const allowVercelPreviews = corsOrigins.some((o) => o.endsWith('.vercel.app'));

export function createApp(): Express {
  const app = express();

  // Vercel edge, Nginx yoki cPanel Passenger ortida ishlaydi — haqiqiy
  // mijoz IP'si X-Forwarded-For sarlavhasidan olinadi.
  // Rate limit va IP hash to'g'ri ishlashi uchun bu majburiy.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Rasmlar boshqa origin'dagi Next.js saytiga yuklanadi.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // CSP frontend tomonda boshqariladi
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Origin yo'q = server-to-server (Next.js SSR) yoki curl — ruxsat beriladi.
        if (!origin || corsOrigins.includes(origin)) return callback(null, true);
        /*
         * Vercel preview deploy'lari har safar yangi tasodifiy URL oladi
         * (`ayntravel-web-git-<branch>-<team>.vercel.app`) — ularni
         * CORS_ORIGINS ro'yxatida oldindan sanab bo'lmaydi. Ro'yxatda
         * kamida bitta `.vercel.app` origin bo'lsagina shu subdomenlarga
         * ruxsat beramiz: o'z domeniga ko'chgandan keyin qoida o'zi o'chadi.
         */
        if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: ${origin} ga ruxsat yo‘q`));
      },
      credentials: true, // auth cookie'lari uchun
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use(
    pinoHttp({
      logger,
      // Sog'liq tekshiruvi har necha soniyada keladi — logni to'ldirmasin.
      autoLogging: { ignore: (req: { url?: string }) => req.url === '/health' },
    }),
  );

  // Local drayverda rasmlarni API o'zi tarqatadi.
  // Production'da bu ishni Nginx bevosita bajargani tezroq.
  if (env.STORAGE_DRIVER === 'local') {
    app.use(
      '/uploads',
      express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
        maxAge: isProd ? '365d' : 0,
        immutable: isProd,
        index: false,
      }),
    );
  }

  app.get('/health', (_req, res) => {
    res.json({ ok: true, data: { status: 'up', time: new Date().toISOString() } });
  });

  /*
   * Muddati o'tgan refresh tokenlarni tozalash.
   *
   * `server.ts` da bu 12 soatlik `setInterval` bilan bajariladi, lekin
   * serverless'da uzoq yashaydigan jarayon yo'q — Vercel Cron kuniga bir
   * marta shu manzilni chaqiradi (`vercel.json` → crons).
   *
   * Vercel so'rovga `Authorization: Bearer $CRON_SECRET` qo'yadi. Sir
   * qo'yilmagan bo'lsa marshrutni umuman ochmaymiz: himoyasiz holda u
   * bazani istalgan odam yuklashi mumkin bo'lgan tugmaga aylanadi.
   */
  app.get('/api/cron/purge-tokens', (req, res, next) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.get('authorization') !== `Bearer ${secret}`) {
      res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Ruxsat yo‘q' } });
      return;
    }
    purgeExpiredTokens()
      .then((purged) => res.json({ ok: true, data: { purged } }))
      .catch(next);
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);

  /**
   * Ommaviy kontent uchun kesh sarlavhasi.
   *
   * Next ISR keshini chetlab o'tgan har bir so'rov (sovuq start, deploy,
   * muddat tugashi, revalidate to'lqini) aks holda to'g'ridan bazaga uradi.
   * `stale-while-revalidate` — eskirgan javob darhol beriladi va fonda
   * yangilanadi, ya'ni foydalanuvchi hech qachon kutmaydi.
   *
   * Faqat GET: POST /api/leads hech qachon keshlanmasligi kerak.
   */
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET' && isProd) {
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    }
    next();
  });
  app.use('/api', publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
