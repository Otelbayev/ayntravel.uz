import { PrismaClient } from '@prisma/client';
import { isDev } from './env.js';

/**
 * Ulanish global'da saqlanadi — ikkala muhitda ham shu kerak:
 *  • dev'da `tsx watch` har o'zgarishda modulni qayta yuklaydi;
 *  • serverless'da bitta instansiya ketma-ket bir necha so'rovni
 *    xizmat qiladi va modul keshi qayta baholanishi mumkin.
 * Saqlamasak har safar yangi ulanish hovuzi ochilib, Postgres limitiga uriladi.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.prisma = prisma;
