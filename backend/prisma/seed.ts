if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production. Use db:seed:admin.');
// `.env` ni o'qiymiz — `tsx` uni o'zi yuklamaydi, Prisma esa
// DATABASE_URL ni process.env dan kutadi.
import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Boshlang'ich kontent — AYN TRAVEL ning haqiqiy Instagram posterlaridan olingan.
 * Seed idempotent: qayta ishga tushirilsa dublikat yaratmaydi, mavjudini yangilaydi.
 */

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@ayntravel.uz';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'AynTravel2026!';

const SETTINGS: Record<string, unknown> = {
  phonePrimary: '+998915443160',
  phoneSecondary: '+998772696767',
  managerMadinaPhone: '+998772696767',
  managerUmidPhone: '+998915443160',
  telegramChannel: 'https://t.me/ayn_travel',
  telegramAdmin: 'https://t.me/ayntravel01',
  telegramManagerMadina: 'https://t.me/ayntravelmanager',
  telegramManagerUmid: 'https://t.me/ayntravel01',
  instagram: 'https://www.instagram.com/ayntravel.uz/',
  email: 'info@ayntravel.uz',
  addressUz: 'Toshkent sh., Shota Rustaveli ko‘chasi, 136/2',
  addressRu: 'г. Ташкент, улица Шота Руставели, 136/2',
  mapUrl: 'https://yandex.uz/maps/-/CTHanBlc',
  mapEmbedUrl: '',
  workingHoursUz: 'Dushanba–Shanba: 09:00–18:00',
  workingHoursRu: 'Понедельник–Суббота: 09:00–18:00',
  heroTitleUz: 'Sayohatingizni biz bilan boshlang',
  heroTitleRu: 'Начните путешествие с нами',
  heroSubtitleUz: 'Turlar • Aviachiptalar • Mehmonxonalar • Viza yordami',
  heroSubtitleRu: 'Туры • Авиабилеты • Отели • Визовая поддержка',
  stats: { toursCount: 120, clientsCount: 5000, followersCount: 25900, yearsCount: 5 },
  defaultOgImage: null,
};


import { DESTINATIONS, SERVICES, FAQS, TOURS, POSTS, PAGES } from './content-data.js';

const TESTIMONIALS = [
  {
    clientName: 'Dilnoza Karimova',
    textUz:
      'Turkiyaga oilamiz bilan bordik. Hamma narsa aytilganidek bo‘ldi — mehmonxona ham, transfer ham. Madina opa har bir savolimizga sabr bilan javob berdi. Rahmat!',
    textRu:
      'Ездили в Турцию всей семьёй. Всё было как обещали — и отель, и трансфер. Спасибо Мадине за терпение и ответы на все вопросы!',
    rating: 5,
    sortOrder: 1,
  },
  {
    clientName: 'Sardor Yusupov',
    textUz:
      'Goryashiy tur bilan Antalyaga uchdim. Narxi juda qulay chiqdi, 5 yulduzli mehmonxona all inclusive. Keyingi safar ham shu yerdan olaman.',
    textRu:
      'Улетел в Анталию по горящему туру. Вышло очень выгодно — 5 звёзд, всё включено. В следующий раз тоже к ним.',
    rating: 5,
    sortOrder: 2,
  },
  {
    clientName: 'Nilufar Rahimova',
    textUz:
      'Angliya vizasini olishda yordam berishdi. Anketani to‘g‘ri to‘ldirib, hujjatlarni tayyorlab berishdi — birinchi urinishda oldim.',
    textRu:
      'Помогли получить визу в Великобританию. Правильно заполнили анкету, подготовили документы — получила с первого раза.',
    rating: 5,
    sortOrder: 3,
  },
  {
    clientName: 'Jamshid Tursunov',
    textUz:
      'Baku turi ajoyib o‘tdi. Menejer Umid aka doim aloqada bo‘ldi, hatto u yerda ham savollarimizga javob berdi.',
    textRu:
      'Тур в Баку прошёл отлично. Менеджер Умид всегда был на связи, отвечал на вопросы даже на месте.',
    rating: 5,
    sortOrder: 4,
  },
];

async function main() {
  console.log('🌱 Seed boshlandi...\n');

  // ── Admin foydalanuvchi ─────────────────────────────────────
  const passwordHash = await argon2.hash(ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: 'AYN TRAVEL Admin',
      role: 'ADMIN',
      passwordHash,
    },
  });
  console.log(`👤 Admin: ${admin.email}`);

  // ── Sozlamalar ──────────────────────────────────────────────
  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    });
  }
  console.log(`⚙️  Sozlamalar: ${Object.keys(SETTINGS).length} ta kalit`);

  // ── Yo'nalishlar ────────────────────────────────────────────
  const destinationIds = new Map<string, string>();
  for (const d of DESTINATIONS) {
    const row = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: d,
      create: d,
    });
    destinationIds.set(d.slug, row.id);
  }
  console.log(`🌍 Yo‘nalishlar: ${DESTINATIONS.length} ta`);

  // ── Xizmatlar, FAQ, sahifalar ───────────────────────────────
  for (const s of SERVICES) {
    await prisma.service.upsert({ where: { slug: s.slug }, update: s, create: s });
  }
  console.log(`🧰 Xizmatlar: ${SERVICES.length} ta`);

  // FAQ da unique kalit yo'q — bo'sh bo'lsagina to'ldiramiz.
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({ data: FAQS });
  }
  console.log(`❓ FAQ: ${FAQS.length} ta`);

  for (const p of PAGES) {
    await prisma.page.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  console.log(`📄 Sahifalar: ${PAGES.length} ta`);

  // ── Turlar ──────────────────────────────────────────────────
  for (const t of TOURS) {
    const { destinationSlug, ...rest } = t;
    const destinationId = destinationIds.get(destinationSlug);
    if (!destinationId) throw new Error(`Yo‘nalish topilmadi: ${destinationSlug}`);

    const data = {
      ...rest,
      destinationId,
      currency: 'USD',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    };

    await prisma.tour.upsert({
      where: { slug: t.slug },
      update: data,
      create: data,
    });
  }
  console.log(`🧳 Turlar: ${TOURS.length} ta`);

  // ── Blog ────────────────────────────────────────────────────
  for (const p of POSTS) {
    const readingTime = Math.max(
      1,
      Math.round((p.bodyUz ?? '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length / 200),
    );
    const data = { ...p, readingTime, status: 'PUBLISHED' as const, publishedAt: new Date() };
    await prisma.post.upsert({ where: { slug: p.slug }, update: data, create: data });
  }
  console.log(`📝 Maqolalar: ${POSTS.length} ta`);

  // ── Mijoz fikrlari ──────────────────────────────────────────
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({ data: TESTIMONIALS });
  }
  console.log(`💬 Fikrlar: ${TESTIMONIALS.length} ta`);

  console.log('\n✅ Seed tugadi.');
  console.log(`\n   Admin panel: /admin/login`);
  console.log(`   Email:  ${ADMIN_EMAIL}`);
  console.log(`   Parol:  ${ADMIN_PASSWORD}`);
  console.log(`\n   ⚠️  Birinchi kirishdan keyin parolni albatta o‘zgartiring!\n`);
}

main()
  .catch((err) => {
    console.error('❌ Seed xatosi:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
