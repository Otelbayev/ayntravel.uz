import { PrismaClient } from '@prisma/client';
import { isDev } from './env.js';

/**
 * Dev'da `tsx watch` har o'zgarishda modulni qayta yuklaydi — global'da
 * saqlamasak, har safar yangi ulanish hovuzi ochilib, Postgres limitiga uriladi.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['warn', 'error'] : ['error'],
  });

if (isDev) globalForPrisma.prisma = prisma;
