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

export function createApp(): Express {
  const app = express();

  // Nginx yoki cPanel Passenger ortida ishlaydi — haqiqiy mijoz IP'si
  // X-Forwarded-For sarlavhasidan olinadi.
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

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
