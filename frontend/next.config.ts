import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/*
 * Server tomondan backend'ga murojaat manzili. Rasmlarni uzatish (rewrite)
 * shu manzil orqali ketadi — u brauzerga ko'rinmaydi.
 */
const internalApiUrl =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /*
   * Mustaqil (standalone) chiqish: `npm run pack` shuni ishlatadi va
   * `dist/` papkasiga serverga yuklashga tayyor to'plam yig'adi (~60 MB,
   * `npm install` kerak emas).
   *
   * MUHIM: `next start` standalone bilan ishlamaydi. Lokal sinov uchun
   * `npm run start` skripti to'g'ridan-to'g'ri standalone serverni
   * ishga tushiradi — package.json ga qarang.
   */
  output: 'standalone',

  images: {
    // AVIF birinchi: Turkiya posterlaridek katta rasmlar uchun WebP'dan ~30% kichik.
    formats: ['image/avif', 'image/webp'],

    /*
     * Yuklangan rasmlar SAYT DOMENI orqali beriladi (`/uploads/...`), API
     * domeni orqali emas. Pastdagi `rewrites()` ularni backend'ga uzatadi.
     *
     * Nega shunday:
     *  • Next 16 tashqi rasm hostini xususiy IP'ga (localhost) yechilsa
     *    SSRF himoyasi tufayli bloklaydi — lokal ishlashda rasmlar chiqmaydi
     *  • `remotePatterns` ni domen o'zgarganda har safar sozlash kerak emas
     *  • rasmlar sayt bilan bir domenda — kesh va CDN sozlash osonroq
     */
    remotePatterns: [
      // Kelajakda S3/R2 CDN'ga o'tilsa — hostini shu yerga qo'shing.
      { protocol: 'https', hostname: '**.ayntravel.uz' },
    ],

    deviceSizes: [360, 480, 640, 828, 1080, 1200, 1920],
    imageSizes: [200, 300, 400, 540],
  },

  /*
   * Yuklangan rasmlarni backend'dan olib, sayt domenida ko'rsatamiz.
   * Brauzer uchun ular oddiy lokal rasm — hech qanday CORS yoki
   * remotePatterns sozlamasi kerak emas.
   */
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${internalApiUrl}/uploads/:path*`,
      },
    ];
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
