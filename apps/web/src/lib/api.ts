import type {
  ApiResponse,
  DashboardStats,
  DestinationDTO,
  FaqDTO,
  LeadDTO,
  Paginated,
  PageDTO,
  PostDTO,
  ServiceDTO,
  SitemapData,
  SiteSettings,
  TestimonialDTO,
  TourDTO,
} from '@ayntravel/shared';

/**
 * Server komponentlari API'ga ichki tarmoq orqali murojaat qiladi
 * (odatda `http://127.0.0.1:4000`), brauzer esa ommaviy manzil orqali.
 */
const INTERNAL_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const baseUrl = typeof window === 'undefined' ? INTERNAL_URL : PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** ISR kesh teglari — admin nashr qilganda shu teglar yangilanadi. */
  tags?: string[];
  /** Necha soniyada qayta tekshirilsin. `0` — keshlamaslik. */
  revalidate?: number | false;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, tags, revalidate, headers, ...rest } = options;

  const res = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    // Brauzerdan yuborilganda auth cookie'lari ham ketishi kerak.
    credentials: typeof window === 'undefined' ? undefined : 'include',
    next: tags || revalidate !== undefined ? { tags, revalidate } : undefined,
  });

  const json = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !json || json.ok === false) {
    const err = json && json.ok === false ? json.error : null;
    throw new ApiError(
      res.status,
      err?.code ?? 'NETWORK_ERROR',
      err?.message ?? 'Serverga ulanib bo‘lmadi',
      err?.fields,
    );
  }

  return json.data;
}

/**
 * Sahifa render qilinayotganda API o'chib qolsa butun sayt 500 bermasligi kerak —
 * bo'sh ro'yxat bilan davom etamiz va konsolga yozamiz.
 */
async function safe<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.error(`[api] ${label} yuklanmadi:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

/** Standart kesh muddati: 5 daqiqa. Nashr qilinganda tag orqali darhol yangilanadi. */
const REVALIDATE = 300;

export interface HomeData {
  hotTours: TourDTO[];
  featuredTours: TourDTO[];
  destinations: DestinationDTO[];
  services: ServiceDTO[];
  testimonials: TestimonialDTO[];
  faqs: FaqDTO[];
  posts: PostDTO[];
  settings: SiteSettings;
}

export const api = {
  home: () =>
    request<HomeData>('/api/home', {
      tags: ['tours', 'destinations', 'services', 'testimonials', 'faq', 'posts', 'settings'],
      revalidate: REVALIDATE,
    }),

  tours: (query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    const qs = params.toString();
    return request<Paginated<TourDTO>>(`/api/tours${qs ? `?${qs}` : ''}`, {
      tags: ['tours'],
      revalidate: REVALIDATE,
    });
  },

  tour: (slug: string) =>
    request<{ tour: TourDTO; related: TourDTO[] }>(`/api/tours/${slug}`, {
      tags: ['tours', `tour:${slug}`],
      revalidate: REVALIDATE,
    }),

  destinations: () =>
    request<DestinationDTO[]>('/api/destinations', {
      tags: ['destinations'],
      revalidate: REVALIDATE,
    }),

  destination: (slug: string) =>
    request<{ destination: DestinationDTO; tours: TourDTO[] }>(`/api/destinations/${slug}`, {
      tags: ['destinations', 'tours'],
      revalidate: REVALIDATE,
    }),

  posts: (page = 1) =>
    request<Paginated<PostDTO>>(`/api/posts?page=${page}`, {
      tags: ['posts'],
      revalidate: REVALIDATE,
    }),

  post: (slug: string) =>
    request<{ post: PostDTO; related: PostDTO[] }>(`/api/posts/${slug}`, {
      tags: ['posts', `post:${slug}`],
      revalidate: REVALIDATE,
    }),

  services: () =>
    request<ServiceDTO[]>('/api/services', { tags: ['services'], revalidate: REVALIDATE }),

  faq: () => request<FaqDTO[]>('/api/faq', { tags: ['faq'], revalidate: REVALIDATE }),

  testimonials: () =>
    request<TestimonialDTO[]>('/api/testimonials', {
      tags: ['testimonials'],
      revalidate: REVALIDATE,
    }),

  page: (slug: string) =>
    request<PageDTO>(`/api/pages/${slug}`, { tags: ['pages'], revalidate: REVALIDATE }),

  settings: () =>
    request<SiteSettings>('/api/settings', { tags: ['settings'], revalidate: REVALIDATE }),

  sitemapData: () =>
    request<SitemapData>('/api/sitemap-data', { tags: ['sitemap'], revalidate: 3600 }),

  /** Ariza yuborish — hech qachon keshlanmaydi. */
  createLead: (body: unknown) =>
    request<{ id: string; message: string }>('/api/leads', {
      method: 'POST',
      body,
      cache: 'no-store',
    }),
};

/** Sahifa qulamasligi uchun xatolarni yutadigan variantlar. */
export const safeApi = {
  settings: () => safe(api.settings(), null as SiteSettings | null, 'settings'),
  destinations: () => safe(api.destinations(), [] as DestinationDTO[], 'destinations'),
  sitemapData: () =>
    safe(
      api.sitemapData(),
      { tours: [], posts: [], destinations: [], pages: [] } as SitemapData,
      'sitemap',
    ),
};

/** Admin panel so'rovlari — har doim yangi ma'lumot, keshsiz. */
export const adminApi = {
  request: <T>(path: string, options: FetchOptions = {}) =>
    request<T>(path, { ...options, cache: 'no-store' }),

  dashboard: () => request<DashboardStats>('/api/admin/dashboard', { cache: 'no-store' }),

  leads: (query: string) =>
    request<Paginated<LeadDTO> & { counts: Record<string, number> }>(
      `/api/admin/leads?${query}`,
      { cache: 'no-store' },
    ),
};
