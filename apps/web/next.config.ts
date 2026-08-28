import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const apiHost = new URL(apiUrl).hostname;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /*
   * Mustaqil (standalone) chiqish: Next faqat haqiqatan kerak bo'lgan
   * modullarni `.next/standalone` ichiga ko'chiradi va ishga tushirish uchun
   * tayyor `server.js` yaratadi.
   *
   * Shared hosting uchun bu muhim: serverda `npm install` qilish shart emas
   * (ko'p cPanel tariflarida xotira yetmaydi) — tayyor papkani yuklash kifoya.
   */
  output: 'standalone',
  // Monorepo'da Next ildizni to'g'ri aniqlashi uchun.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),

  images: {
    // AVIF birinchi: Turkiya posterlaridek katta rasmlar uchun WebP'dan ~30% kichik.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'http', hostname: apiHost, port: new URL(apiUrl).port || undefined, pathname: '/uploads/**' },
      { protocol: 'https', hostname: apiHost, pathname: '/uploads/**' },
      { protocol: 'https', hostname: '**.ayntravel.uz' },
      // S3/R2 ga o'tilganda shu yerga CDN hostini qo'shing.
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
