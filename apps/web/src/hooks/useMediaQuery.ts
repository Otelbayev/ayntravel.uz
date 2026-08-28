'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Media so'rovini kuzatadi.
 *
 * `useSyncExternalStore` ishlatiladi — bu brauzer API'siga obuna bo'lish uchun
 * React tavsiya qiladigan usul. `useEffect` + `setState` variantidan farqi:
 *  • birinchi renderdayoq to'g'ri qiymat olinadi (ortiqcha qayta render yo'q)
 *  • server render uchun alohida qiymat beriladi, ya'ni gidratatsiya buzilmaydi
 *
 * Server tomonda har doim `false` qaytaradi, shuning uchun komponentlar SSR
 * paytida eng oddiy (mobil / fallback) variantni chizishi kerak.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  // Serverda `matchMedia` yo'q — fallback variantni tanlaymiz.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
