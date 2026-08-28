'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Sahifa berilgan masofadan ko'proq scroll qilinganini kuzatadi.
 *
 * `useSyncExternalStore` — brauzer holatiga obuna bo'lishning React tavsiya
 * qiladigan usuli: birinchi renderdayoq to'g'ri qiymat beradi va effekt
 * ichida `setState` chaqirishga hojat qolmaydi.
 */
export function useScrolled(threshold = 24): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('scroll', onChange, { passive: true });
    return () => window.removeEventListener('scroll', onChange);
  }, []);

  const getSnapshot = useCallback(() => window.scrollY > threshold, [threshold]);

  // Serverda scroll yo'q — shapka shaffof holatda chiziladi.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
