import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Ikki vazifa:
 *  1. /admin — cookie'siz kirishni login sahifasiga yo'naltiradi (til prefiksisiz).
 *  2. Qolgan hamma narsa — next-intl til marshrutlashi.
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const hasSession = request.cookies.has('ayn_access') || request.cookies.has('ayn_refresh');

    if (!hasSession && !isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      // Kirgandan keyin foydalanuvchi ketmoqchi bo'lgan sahifaga qaytariladi.
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    if (hasSession && isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Statik fayllar, Next.js ichki yo'llari va API'dan tashqari hamma narsa.
    '/((?!api|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
    '/',
    '/admin/:path*',
  ],
};
