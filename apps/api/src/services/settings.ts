import type { SiteSettings } from '@ayntravel/shared';
import { prisma } from '../db.js';

/**
 * Sayt sozlamalarining bazaviy qiymatlari — AYN TRAVEL ning haqiqiy ma'lumotlari.
 * Bazada yozuv bo'lmasa shular ishlatiladi, ya'ni sayt seed'siz ham to'g'ri ishlaydi.
 * Admin panelda o'zgartirilgan qiymat bazadagisi bilan ustiga yoziladi.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  phonePrimary: '+998915443160',
  phoneSecondary: '+998772696767',
  managerMadinaPhone: '+998772696767',
  managerUmidPhone: '+998915443160',
  telegramChannel: 'https://t.me/ayn_travel',
  telegramAdmin: 'https://t.me/ayntravel01',
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
  heroSubtitleUz: 'Turlar • Aviachiptalar • Mehmonxonalar • Vizа yordami',
  heroSubtitleRu: 'Туры • Авиабилеты • Отели • Визовая поддержка',
  stats: { toursCount: 120, clientsCount: 5000, followersCount: 25900, yearsCount: 5 },
  defaultOgImage: null,
};

/** Bazadagi key/value juftlarini bitta obyektga yig'adi. */
export async function getSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as SiteSettings;
}

export async function updateSettings(patch: Record<string, unknown>): Promise<SiteSettings> {
  await prisma.$transaction(
    Object.entries(patch).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value as never },
        update: { value: value as never },
      }),
    ),
  );
  return getSettings();
}
