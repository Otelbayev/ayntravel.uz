/**
 * Bo'sh production bazasini boshlang'ich kontent bilan to'ldiradi.
 *
 * Vercel build'ida `prisma migrate deploy` dan keyin ishga tushadi
 * (`vercel.json` → buildCommand). Faqat baza BO'SH bo'lsa ishlaydi —
 * yo'nalish, tur yoki xizmat mavjud bo'lsa hech narsaga tegmaydi, shuning
 * uchun keyingi deploy'lar admin paneldagi o'zgarishlarni buzmaydi.
 *
 * Rasmlar Unsplash'dan (Unsplash License — tijoriy foydalanish bepul)
 * olinadi va admin paneldagi yuklash bilan AYNAN bir xil yo'ldan o'tadi:
 * sharp → 4 nisbat × AVIF/WebP → joriy saqlash drayveri (Vercel Blob).
 *
 * Xato bo'lsa deploy yiqilmaydi: kontentni admin paneldan ham qo'shish mumkin.
 * O'chirish: SEED_CONTENT=0.
 */
import 'dotenv/config';
import { PrismaClient, type Prisma } from '@prisma/client';
import { processImage } from '../src/services/images.js';
import { DESTINATIONS, FAQS, PAGES, POSTS, SERVICES, TOURS } from './content-data.js';

/** Unsplash rasm identifikatorlari (images.unsplash.com/photo-<id>). */
const PHOTOS = {
  destinations: {
    turkiya: '1664733580167-c173c66db392',
    ozarbayjon: '1596306499398-8d88944a5ec4',
    gruziya: '1565008576549-57569a49371d',
    vyetnam: '1528127269322-539801943592',
    dubay: '1512453979798-5ea266f8880c',
    xitoy: '1548474931-a21c23cb85c3',
    misr: '1600520611035-84157ad4084d',
    tailand: '1681459878397-14dc6d270fe4',
    maldiv: '1573843981267-be1999ff37cd',
  } as Record<string, string>,
  tours: {
    'turkiya-mojizalari-istanbul-chanakkale-pamukkale-antalya': [
      '1695589593603-129adfecac13',
      '1604156789095-3348604c0f43',
      '1593238739364-18cfde30e522',
    ],
    'ozarbayjon-baku-turi': ['1689189044045-7cb0767e5cf1', '1674857977971-131936c7b5ea'],
    'tbilisi-batumi-turi': ['1625566360146-918001e76064', '1559787248-5beaa0e086bc'],
    'nha-trang-vyetnam-turi': ['1533002832-1721d16b4bb9', '1519046904884-53103b34b206'],
    'istanbul-tarix-va-zamonaviylik': ['1524231757912-21f4fe3a7200', '1589561454226-796a8aa89b05'],
    'xitoy-xaynan-oroli': ['1627448449276-8c139d0790a6', '1636612298929-0d862da2641d'],
    'antalya-goryashiy-tur': ['1593238738950-01f243cac6fc', '1648325129746-abcc1b872380'],
    'dubay-turi': ['1576159470850-494c8b17aca0', '1580674684081-7617fbf3d745'],
  } as Record<string, string[]>,
  posts: {
    'ozbekistonliklar-uchun-vizasiz-davlatlar-2026': '1581553672347-95d9444c0d2c',
    'goryashiy-tur-nima-va-qanday-tanlash-kerak': '1488085061387-422e29b40080',
    'birinchi-marta-chet-elga-chiqayotganlar-uchun-yodnoma': '1530469641172-8ac15d0a7d6a',
  } as Record<string, string>,
};

// Migratsiyalar singari to'g'ridan-to'g'ri ulanish: interaktiv tranzaksiya
// pgbouncer transaction rejimida ishonchli emas.
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

type Alt = { uz: string; ru?: string | null };

async function importPhoto(id: string, name: string, alt: Alt): Promise<string | null> {
  const url = `https://images.unsplash.com/photo-${id}?w=2200&q=85&fm=jpg&fit=max`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const processed = await processImage(buffer, `${name}.jpg`);
      const media = await prisma.media.create({
        data: {
          kind: 'IMAGE',
          filename: processed.filename,
          originalName: `${name}.jpg`,
          mimeType: 'image/jpeg',
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
          variants: processed.variants as Prisma.InputJsonValue,
          blurDataUrl: processed.blurDataUrl,
          altUz: alt.uz,
          altRu: alt.ru ?? null,
        },
        select: { id: true },
      });
      console.log(`  🖼  ${name}`);
      return media.id;
    } catch (err) {
      console.warn(`  ⚠️  ${name} (urinish ${attempt}/3): ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return null;
}

/** Bir vaqtda `limit` tadan ortiq rasm qayta ishlanmasin — build xotirasi cheklangan. */
async function pool<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, async () => {
      while (next < tasks.length) {
        const i = next++;
        results[i] = await tasks[i]();
      }
    }),
  );
  return results;
}

async function main() {
  if (process.env.SEED_CONTENT === '0') {
    console.log('ℹ️  SEED_CONTENT=0 — kontent seed o‘tkazib yuborildi.');
    return;
  }

  const [destinations, tours, services] = await Promise.all([
    prisma.destination.count(),
    prisma.tour.count(),
    prisma.service.count(),
  ]);
  if (destinations + tours + services > 0) {
    console.log('ℹ️  Bazada kontent bor — seed kerak emas.');
    return;
  }

  console.log('🌱 Bo‘sh baza: boshlang‘ich kontent yuklanmoqda...');

  // ── Rasmlar ────────────────────────────────────────────────
  const destTitles = new Map(DESTINATIONS.map((d) => [d.slug, d]));
  const tourTitles = new Map(TOURS.map((t) => [t.slug, t]));
  const postTitles = new Map(POSTS.map((p) => [p.slug, p]));

  type Job = { key: string; run: () => Promise<string | null> };
  const jobs: Job[] = [];
  for (const [slug, id] of Object.entries(PHOTOS.destinations)) {
    const d = destTitles.get(slug);
    jobs.push({ key: `d:${slug}`, run: () => importPhoto(id, `yonalish-${slug}`, { uz: d?.nameUz ?? slug, ru: d?.nameRu }) });
  }
  for (const [slug, ids] of Object.entries(PHOTOS.tours)) {
    const t = tourTitles.get(slug);
    ids.forEach((id, i) =>
      jobs.push({ key: `t:${slug}:${i}`, run: () => importPhoto(id, `tur-${slug.slice(0, 24)}-${i + 1}`, { uz: t?.titleUz ?? slug, ru: t?.titleRu }) }),
    );
  }
  for (const [slug, id] of Object.entries(PHOTOS.posts)) {
    const p = postTitles.get(slug);
    jobs.push({ key: `p:${slug}`, run: () => importPhoto(id, `blog-${slug.slice(0, 28)}`, { uz: p?.titleUz ?? slug, ru: p?.titleRu }) });
  }

  const ids = await pool(jobs.map((j) => j.run), 3);
  const media = new Map<string, string>();
  jobs.forEach((j, i) => {
    if (ids[i]) media.set(j.key, ids[i]!);
  });
  console.log(`🖼  Rasmlar: ${media.size}/${jobs.length}`);

  // ── Kontent — bitta tranzaksiyada: yarim to'lgan baza qolmasin ──
  const now = new Date();
  await prisma.$transaction(
    async (tx) => {
      const destinationIds = new Map<string, string>();
      for (const d of DESTINATIONS) {
        const row = await tx.destination.create({
          data: { ...d, heroImageId: media.get(`d:${d.slug}`) ?? null },
        });
        destinationIds.set(d.slug, row.id);
      }

      await tx.service.createMany({ data: SERVICES });
      if ((await tx.faq.count()) === 0) await tx.faq.createMany({ data: FAQS });
      for (const p of PAGES) {
        await tx.page.upsert({ where: { slug: p.slug }, update: {}, create: p });
      }

      for (const t of TOURS) {
        const { destinationSlug, ...rest } = t;
        const destinationId = destinationIds.get(destinationSlug);
        if (!destinationId) throw new Error(`Yo‘nalish topilmadi: ${destinationSlug}`);
        const gallery = (PHOTOS.tours[t.slug] ?? [])
          .map((_, i) => media.get(`t:${t.slug}:${i}`))
          .filter((id): id is string => Boolean(id));
        await tx.tour.create({
          data: {
            ...rest,
            destinationId,
            currency: 'USD',
            status: 'PUBLISHED',
            publishedAt: now,
            posterImageId: gallery[0] ?? null,
            gallery: { create: gallery.map((mediaId, sortOrder) => ({ mediaId, sortOrder })) },
          },
        });
      }

      for (const p of POSTS) {
        const words = (p.bodyUz ?? '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
        await tx.post.create({
          data: {
            ...p,
            readingTime: Math.max(1, Math.round(words / 200)),
            status: 'PUBLISHED',
            publishedAt: now,
            coverImageId: media.get(`p:${p.slug}`) ?? null,
          },
        });
      }
    },
    { timeout: 60_000, maxWait: 20_000 },
  );

  console.log(
    `✅ Kontent tayyor: ${DESTINATIONS.length} yo‘nalish, ${TOURS.length} tur, ${SERVICES.length} xizmat, ${FAQS.length} FAQ, ${POSTS.length} maqola, ${PAGES.length} sahifa.`,
  );
}

main()
  .catch((err) => {
    // Deploy'ni yiqitmaymiz — sayt kontentsiz ham ishlaydi, admin panel ochiq.
    console.error('⚠️  Kontent seed xatosi (deploy davom etadi):', err);
  })
  .finally(() => prisma.$disconnect());
