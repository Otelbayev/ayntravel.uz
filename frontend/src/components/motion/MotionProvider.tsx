'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Butun sayt uchun harakat sozlamalari.
 *
 * `reducedMotion="user"` — Motion'ning barcha komponentlari operatsion
 * tizimdagi "harakatni kamaytirish" sozlamasini avtomatik hurmat qiladi:
 * transform va layout animatsiyalari o'chadi, faqat `opacity` qoladi.
 *
 * Bu global kafolat: alohida komponentda `useReducedMotion` tekshiruvi
 * unutilib qolsa ham, foydalanuvchi keraksiz harakatdan himoyalangan bo'ladi.
 * Vestibulyar buzilishi bor odamlar uchun parallaks va sakrab chiquvchi
 * elementlar bosh aylanishiga sabab bo'ladi — bu shunchaki qulaylik emas.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
