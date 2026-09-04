import { waitUntil } from '@vercel/functions';
import { logger } from '../logger.js';

/**
 * Javob yuborilgandan keyin ham tugashi kerak bo'lgan ishni ro'yxatga oladi.
 *
 * Nima uchun kerak: serverless'da javob oqimi yopilishi bilan funksiya
 * MUZLATILADI. `void somePromise()` deb qo'yib yuborilgan ish — Telegram
 * xabari, ISR revalidate, ko'rishlar hisoblagichi — shunda o'rtada uzilib
 * qoladi va hech qanday xato ham chiqmaydi. `waitUntil` ish tugaguncha
 * funksiyani tirik ushlab turadi (javobni esa kechiktirmaydi).
 *
 * Vercel'dan tashqarida (lokal `npm run dev`, VPS) `waitUntil` konteksti
 * yo'q va u xato tashlaydi — u holda oddiy fon promise'iga qaytamiz,
 * chunki u yerda jarayon baribir ishlab turaveradi.
 */
export function background(work: Promise<unknown>, context?: Record<string, unknown>): void {
  const safe = work.catch((err) => {
    logger.error({ err, ...context }, 'Fon vazifasi bajarilmadi');
  });

  try {
    waitUntil(safe);
  } catch {
    void safe;
  }
}
