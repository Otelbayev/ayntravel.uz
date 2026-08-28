'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminClient, AdminApiError } from '@/lib/admin-client';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Admin paneldagi ro'yxat va yozuvlarni yuklash uchun umumiy hook.
 *
 * Ikkita muammoni hal qiladi:
 *
 * 1. **Poyga holati.** Menejer filtrni tez almashtirsa, birinchi so'rov
 *    ikkinchisidan keyin qaytishi mumkin va ekranda ESKI natija qolib
 *    ketardi. `active` bayrog'i eskirgan javobni e'tiborsiz qoldiradi.
 *
 * 2. **Effekt ichida sinxron `setState`.** Bu ortiqcha qayta renderlarga
 *    olib keladi. Boshlang'ich `loading: true` holati allaqachon to'g'ri,
 *    shuning uchun effekt tanasida hech narsa o'rnatilmaydi — holat faqat
 *    javob kelganda yangilanadi.
 */
export function useAdminResource<T>(path: string) {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Qayta yuklash uchun hisoblagich — `reload()` shuni oshiradi.
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    adminClient
      .get<T>(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!active) return;
        setState({
          data: null,
          loading: false,
          error: err instanceof AdminApiError ? err.message : 'Ma’lumot yuklanmadi',
        });
      });

    return () => {
      // Komponent yopilsa yoki so'rov o'zgarsa — eski javobni qabul qilmaymiz.
      active = false;
    };
  }, [path, nonce]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setNonce((n) => n + 1);
  }, []);

  /** Ro'yxatni serverdan qayta so'ramasdan yangilash (optimistik o'zgarish). */
  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setState((prev) => ({ ...prev, data: updater(prev.data) }));
  }, []);

  return { ...state, reload, setData };
}
