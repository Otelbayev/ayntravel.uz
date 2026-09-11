// `.env` ni o'qiymiz — `tsx` uni o'zi yuklamaydi, Prisma esa
// DATABASE_URL ni process.env dan kutadi.
import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

/**
 * Faqat birinchi admin hisobini yaratadi — boshqa hech narsa.
 *
 * `seed.ts` dan farqi: u lokal ishlab chiqish uchun demo kontent
 * (turlar, rasmlar, sozlamalar) to'kadi. Production'da esa baza bo'sh
 * bo'lishi kerak: kontent admin panel orqali kiritiladi, aks holda
 * mijoz saytini o'zining bo'lmagan ma'lumotidan tozalab chiqishga
 * majbur bo'ladi.
 *
 *   SEED_ADMIN_EMAIL=siz@example.com \
 *   SEED_ADMIN_PASSWORD='kuchli-parol' npm run db:seed:admin
 */

const prisma = new PrismaClient();

const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;

async function main() {
  // Parolni default bilan to'ldirmaymiz: production bazasiga hamma
  // biladigan parol bilan admin qo'yish — ochiq eshik.
  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL va SEED_ADMIN_PASSWORD kerak.\n' +
        "  Misol: SEED_ADMIN_EMAIL=siz@example.com SEED_ADMIN_PASSWORD='...' npm run db:seed:admin",
    );
  }
  if (password.length < 10) {
    throw new Error('SEED_ADMIN_PASSWORD kamida 10 belgi bo‘lsin');
  }

  const passwordHash = await argon2.hash(password);

  // Idempotent: qayta ishga tushirilsa parolni yangilaydi — unutilgan
  // parolni tiklashning eng qisqa yo'li ham shu.
  const admin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true, role: 'ADMIN' },
    create: { email, name: 'AYN TRAVEL Admin', role: 'ADMIN', passwordHash },
  });

    await tx.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    return user;
  });
  console.log(`✅ Admin tayyor: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(`\n❌ ${err instanceof Error ? err.message : err}\n`);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
