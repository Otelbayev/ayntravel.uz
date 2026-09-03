import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * Marshrutlar ikkala tilda ham o'z tilida yoziladi: /uz/turlar va /ru/tury.
 * Bu SEO uchun muhim — rus tilida qidiruvchi "туры в турцию" so'rovida
 * URL'dagi "tury" so'zi ham signal beradi.
 */
export const routing = defineRouting({
  locales: ['uz', 'ru'],
  defaultLocale: 'uz',
  // Har doim prefiks: /uz/... va /ru/... — canonical URL aniq bo'ladi,
  // dublikat kontent muammosi tug'ilmaydi.
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/turlar': { uz: '/turlar', ru: '/tury' },
    '/turlar/[slug]': { uz: '/turlar/[slug]', ru: '/tury/[slug]' },
    '/yonalishlar': { uz: '/yonalishlar', ru: '/napravleniya' },
    '/yonalishlar/[slug]': { uz: '/yonalishlar/[slug]', ru: '/napravleniya/[slug]' },
    '/xizmatlar': { uz: '/xizmatlar', ru: '/uslugi' },
    '/blog': { uz: '/blog', ru: '/blog' },
    '/blog/[slug]': { uz: '/blog/[slug]', ru: '/blog/[slug]' },
    '/biz-haqimizda': { uz: '/biz-haqimizda', ru: '/o-nas' },
    '/aloqa': { uz: '/aloqa', ru: '/kontakty' },
    '/ommaviy-oferta': { uz: '/ommaviy-oferta', ru: '/oferta' },
    '/maxfiylik-siyosati': { uz: '/maxfiylik-siyosati', ru: '/konfidencialnost' },
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type AppLocale = (typeof routing.locales)[number];

/** Locale'ni avtomatik saqlaydigan Link/router — oddiy next/link o'rniga shular. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
