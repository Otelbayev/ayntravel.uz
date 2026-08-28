'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Lenis — silliq scroll. Scroll-based animatsiyalar (parallaks, sticky bloklar)
 * aynan shu tekis harakat ustida chiroyli ko'rinadi.
 *
 * Harakatni kamaytirish so'ralgan bo'lsa umuman ishga tushirilmaydi:
 * bunday foydalanuvchi uchun brauzerning o'z scrolli to'g'ri xatti-harakat.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Mobil qurilmalarda native scroll tezroq va batareyani kam yeydi.
      syncTouch: false,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
