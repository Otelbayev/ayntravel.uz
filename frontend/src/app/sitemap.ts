import type { MetadataRoute } from 'next';
import { safeApi } from '@/lib/api';
import { SITE_URL } from '@/lib/seo';
import { routing } from '@/i18n/routing';

/** Sitemap soatiga bir marta qayta quriladi; nashr qilinganda tag orqali darhol. */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/**
 * Har bir URL uchun ikki tildagi muqobillarini ham beramiz.
 * Google `alternates.languages` ni hreflang sifatida o'qiydi va
 * uz/ru versiyalarini dublikat emas, tarjima deb tushunadi.
 */
function entry(
  pathUz: string,
  pathRu: string,
  lastModified: Date,
  priority: number,
  changeFrequency: Entry['changeFrequency'],
): Entry[] {
  const languages = {
    uz: `${SITE_URL}/uz${pathUz}`,
    ru: `${SITE_URL}/ru${pathRu}`,
  };

  return routing.locales.map((locale) => ({
    url: locale === 'ru' ? languages.ru : languages.uz,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await safeApi.sitemapData();
  const now = new Date();

  const staticPages: Entry[] = [
    ...entry('', '', now, 1, 'daily'),
    ...entry('/turlar', '/tury', now, 0.9, 'daily'),
    ...entry('/xizmatlar', '/uslugi', now, 0.7, 'monthly'),
    ...entry('/blog', '/blog', now, 0.7, 'weekly'),
    ...entry('/biz-haqimizda', '/o-nas', now, 0.5, 'monthly'),
    ...entry('/aloqa', '/kontakty', now, 0.6, 'monthly'),
  ];

  const tours = data.tours.flatMap((tour) =>
    entry(
      `/turlar/${tour.slug}`,
      `/tury/${tour.slug}`,
      new Date(tour.updatedAt),
      0.8,
      'weekly',
    ),
  );

  // Yo'nalish landinglari qidiruvda eng ko'p trafik keltiradi —
  // shuning uchun turlardan ham yuqori ustuvorlik.
  const destinations = data.destinations.flatMap((destination) =>
    entry(
      `/yonalishlar/${destination.slug}`,
      `/napravleniya/${destination.slug}`,
      new Date(destination.updatedAt),
      0.85,
      'weekly',
    ),
  );

  const posts = data.posts.flatMap((post) =>
    entry(`/blog/${post.slug}`, `/blog/${post.slug}`, new Date(post.updatedAt), 0.6, 'monthly'),
  );

  return [...staticPages, ...destinations, ...tours, ...posts];
}
