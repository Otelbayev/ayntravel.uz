import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './logger.js';
import { prisma } from './db.js';
import { purgeExpiredTokens } from './services/tokens.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, storage: env.STORAGE_DRIVER },
    `✈️  AYN TRAVEL API ishga tushdi: http://localhost:${env.PORT}`,
  );
});

// Muddati o'tgan refresh tokenlarni startda va har 12 soatda tozalaymiz.
void purgeExpiredTokens().catch(() => undefined);
const cleanupTimer = setInterval(
  () => void purgeExpiredTokens().catch(() => undefined),
  12 * 60 * 60 * 1000,
);
cleanupTimer.unref();

/**
 * Passenger va PM2 qayta ishga tushirishda `SIGTERM` yuboradi. Ochiq
 * so'rovlarni tugatib, keyin bazadan uzilamiz —
 * shunda deploy paytida mijozning arizasi yo'qolmaydi.
 */
async function shutdown(signal: string) {
  logger.info({ signal }, 'Server to‘xtatilmoqda...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server to‘xtadi');
    process.exit(0);
  });
  // 10 soniyada yopilmasa majburan chiqamiz.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Ushlanmagan promise rejection');
});
