import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /*
   * Standalone chiqish faqat SO'RALGANDA.
   *
   * Vercel ilovani o'zi bo'laklarga ajratadi — standalone u yerda
   * ortiqcha va build'ni sekinlashtiradi. cPanel/VPS uchun esa
   * `npm run pack` unga tayanadi, shuning uchun butunlay olib
   * tashlamaymiz: `BUILD_STANDALONE=1 npm run build` eski yo'lni
   * tiklaydi (`npm run pack` buni o'zi qiladi).
   */
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,

  images: {
    // AVIF birinchi: Turkiya posterlaridek katta rasmlar uchun WebP'dan ~30% kichik.
    formats: ['image/avif', 'image/webp'],

    /*
     * Yuklangan rasmlar Vercel Blob'da yotadi va backend ularning to'liq
     * URL'ini bazaga yozadi (`ASSET_BASE_URL`). Shuning uchun host shu
     * yerda ochiq bo'lishi shart — aks holda `next/image` 400 qaytaradi.
     *
     * Lokalda `STORAGE_DRIVER=local` bo'lsa URL nisbiy (`/uploads/...`)
     * bo'ladi va bu ro'yxat umuman ishlatilmaydi.
     */
    remotePatterns: [
      // Vercel Blob — har bir store o'z subdomenida.
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      // O'z domeniga o'tilganda (CDN yoki API orqali beriladigan rasmlar).
      { protocol: 'https', hostname: '**.ayntravel.uz' },
    ],

    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1920],
    imageSizes: [200, 300, 400, 540],
  },

  async redirects() {
    return [
      // Eski/qisqa manzillar — foydalanuvchi odatda shularni yozadi.
      { source: '/tours', destination: '/uz/turlar', permanent: true },
      { source: '/blog', destination: '/uz/blog', permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
