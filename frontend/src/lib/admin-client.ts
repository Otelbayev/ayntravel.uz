'use client';

import type { ApiResponse } from '@/shared';

/**
 * Admin panel uchun brauzer tomonidagi API mijozi.
 *
 * Ommaviy `lib/api.ts` dan ikki jihati bilan farq qiladi:
 *  • cookie'lar bilan ishlaydi (`credentials: 'include'`)
 *  • access token muddati tugaganda avtomatik yangilaydi va so'rovni takrorlaydi —
 *    menejer 15 daqiqada bir marta qayta login qilib o'tirmasligi kerak.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class AdminApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

/** Bir vaqtning o'zida bir nechta so'rov 401 olsa, refresh faqat bir marta ketadi. */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        // Keyingi 401 uchun yangi urinishga ruxsat beramiz.
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }
  return refreshPromise;
}

interface Options extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** FormData yuborilganda Content-Type ni brauzer o'zi qo'yadi. */
  formData?: FormData;
}

async function call<T>(path: string, options: Options = {}, isRetry = false): Promise<T> {
  const { body, formData, headers, ...rest } = options;

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: formData ?? (body ? JSON.stringify(body) : undefined),
  });

  // Sessiya eskirgan bo'lsa bir marta yangilab, so'rovni takrorlaymiz.
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) return call<T>(path, options, true);

    /*
     * Yangilab bo'lmadi — login sahifasiga qaytaramiz.
     *
     * Bu yerda ataylab `router.push()` emas, to'liq sahifa yuklanishi
     * ishlatiladi: sessiya tugaganda brauzerdagi barcha React holati
     * (keshdagi foydalanuvchi ma'lumoti, ochiq formalar, ro'yxatlar)
     * tozalanishi kerak. `router.push()` ularni saqlab qoldirardi.
     */
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new AdminApiError(401, 'UNAUTHORIZED', 'Sessiya tugadi');
  }

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !json || json.ok === false) {
    const err = json && json.ok === false ? json.error : null;
    throw new AdminApiError(
      res.status,
      err?.code ?? 'NETWORK_ERROR',
      err?.message ?? 'Serverga ulanib bo‘lmadi',
      err?.fields,
    );
  }

  return json.data;
}

export const adminClient = {
  get: <T>(path: string) => call<T>(path),
  post: <T>(path: string, body?: unknown) => call<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => call<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => call<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => call<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) => call<T>(path, { method: 'POST', formData }),

  /** CSV kabi fayllarni yuklab olish — JSON konvertidan tashqarida. */
  download: async (path: string, filename: string) => {
    const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
    if (!res.ok) throw new AdminApiError(res.status, 'DOWNLOAD_FAILED', 'Faylni yuklab bo‘lmadi');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },

  logout: async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(
      () => undefined,
    );
    /*
     * Chiqishda to'liq qayta yuklash majburiy: aks holda oldingi
     * foydalanuvchining ma'lumotlari brauzer xotirasida qolib ketadi va
     * keyingi kirgan odam ularni ko'rishi mumkin.
     */
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/admin/login';
  },
};

export const API_BASE = BASE;
