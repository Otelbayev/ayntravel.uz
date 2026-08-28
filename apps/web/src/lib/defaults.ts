import type { SiteSettings } from '@ayntravel/shared';

/**
 * API javob bermay qolganda ishlatiladigan zaxira sozlamalar.
 *
 * Bu shunchaki ehtiyot chorasi emas: telefon raqamlari saytning eng muhim
 * elementi. Backend o'chsa ham foydalanuvchi raqamni ko'rib qo'ng'iroq qila
 * olishi kerak — aks holda biz mijozni yo'qotamiz.
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
  heroSubtitleUz: 'Turlar • Aviachiptalar • Mehmonxonalar • Viza yordami',
  heroSubtitleRu: 'Туры • Авиабилеты • Отели • Визовая поддержка',
  stats: { toursCount: 120, clientsCount: 5000, followersCount: 25900, yearsCount: 5 },
  defaultOgImage: null,
};
