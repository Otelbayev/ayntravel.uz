import { env } from '../env.js';
import { logger } from '../logger.js';

/**
 * Admin kontentni nashr qilganda Next.js keshini yangilaydi.
 * Shunday qilib sayt statik tez qoladi, lekin o'zgarish darhol ko'rinadi.
 *
 * Xato bo'lsa faqat log yoziladi — admin amali baribir muvaffaqiyatli sanaladi
 * (eng yomoni sahifa `revalidate` vaqti kelguncha eskiroq bo'lib turadi).
 */
export async function revalidate(payload: { tags?: string[]; paths?: string[] }): Promise<void> {
  if (!env.REVALIDATE_SECRET) {
    logger.debug('REVALIDATE_SECRET yo‘q — kesh yangilash o‘tkazib yuborildi');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${env.WEB_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': env.REVALIDATE_SECRET,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) logger.warn({ status: res.status, ...payload }, 'Kesh yangilanmadi');
    else logger.debug(payload, 'Kesh yangilandi');
  } catch (err) {
    logger.warn({ err, ...payload }, 'Kesh yangilash so‘rovi muvaffaqiyatsiz');
  } finally {
    clearTimeout(timeout);
  }
}

/** Faqat teglarni yangilaydigan qisqa variant. */
export async function revalidatePaths(tags: string[]): Promise<void> {
  return revalidate({ tags });
}

/** Ko'p ishlatiladigan kesh teglari. */
export const CacheTags = {
  tours: 'tours',
  posts: 'posts',
  destinations: 'destinations',
  services: 'services',
  faq: 'faq',
  testimonials: 'testimonials',
  settings: 'settings',
  pages: 'pages',
  sitemap: 'sitemap',
} as const;

/**
 * Bitta yozuv uchun aniq teglar.
 *
 * Umumiy `tours` / `destinations` teglari juda keng: bitta tur nashr etilsa
 * barcha yo'nalish landinglari ham kuyardi. Aniq teg faqat kerakli sahifani
 * yangilaydi.
 */
export const entityTags = {
  tour: (slug: string) => `tour:${slug}`,
  post: (slug: string) => `post:${slug}`,
  destination: (slug: string) => `destination:${slug}`,
} as const;

/**
 * Bitta yozuv uchun ikkala tildagi aniq manzillarni yasaydi.
 *
 * Bu `revalidatePath` uchun kerak: agar sahifa nashr etilishidan oldin
 * so'ralgan bo'lsa, Next 404 ni keshlab qo'yadi va uni faqat marshrut
 * yo'li bo'yicha tozalash mumkin (teg bo'yicha emas).
 */
export const localizedPaths = {
  tour: (slug: string) => [`/uz/turlar/${slug}`, `/ru/tury/${slug}`],
  post: (slug: string) => [`/uz/blog/${slug}`, `/ru/blog/${slug}`],
  destination: (slug: string) => [`/uz/yonalishlar/${slug}`, `/ru/napravleniya/${slug}`],
  /**
   * Yangi yozuv qo'shilganda yangilanishi kerak bo'lgan umumiy sahifalar.
   * `/sitemap.xml` ham shu yerda: u soatiga bir marta qayta quriladi, lekin
   * yangi sahifa qidiruv tizimlariga darhol ko'rinishi uchun kutib o'tirmaymiz.
   */
  lists: () => [
    '/uz',
    '/ru',
    '/uz/turlar',
    '/ru/tury',
    '/uz/yonalishlar',
    '/ru/napravleniya',
    '/uz/blog',
    '/ru/blog',
    '/sitemap.xml',
  ],
} as const;
