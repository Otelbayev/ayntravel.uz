import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Faqat next-intl til marshrutlashi.
 *
 * ── Nega bu yerda /admin qorovuli yo'q ──────────────────────────
 *
 * Avval bu middleware `ayn_access` / `ayn_refresh` cookie'sini tekshirib,
 * cookie'siz kirishni login sahifasiga yuborardi. Frontend va API alohida
 * domenlarda (`*.vercel.app`) ishlaganda bu ISHLAMAYDI: cookie'ni API
 * domeni o'rnatadi va brauzer uni sayt domeniga hech qachon yubormaydi.
 * Natijada tekshiruv doim "sessiya yo'q" deb qaytarardi — muvaffaqiyatli
 * login'dan keyin ham foydalanuvchi login sahifasiga qaytib, cheksiz
 * siklga tushardi.
 *
 * Himoya yo'qolgani yo'q — u hech qachon shu yerda emas edi:
 *  • haqiqiy avtorizatsiya backendda (`requireAuth` middleware'i);
 *  • `AdminShell` har ochilishda `/api/auth/me` ni so'raydi;
 *  • `admin-client.ts` 401 javobida login sahifasiga qaytaradi.
 * Bu yerdagi tekshiruv faqat bir zumlik ko'rinishni tejash uchun edi.
 */
export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Statik fayllar, Next.js ichki yo'llari, API va admin'dan tashqari hamma narsa.
    // Admin paneli o'z layoutida, tilsiz — next-intl unga tegmasligi kerak.
    '/((?!api|admin|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
    '/',
  ],
};
