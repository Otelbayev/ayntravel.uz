import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../shared/index.js';
import { verifyAccessToken, resolveAccessSession, type AccessPayload } from '../services/tokens.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export const ACCESS_COOKIE = 'ayn_access';
export const REFRESH_COOKIE = 'ayn_refresh';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}

/**
 * Token cookie'dan yoki `Authorization: Bearer` sarlavhasidan olinadi.
 * Cookie — brauzerdagi admin panel uchun, Bearer — skript/integratsiyalar uchun.
 */
function extractToken(req: Request): string | null {
  const fromCookie = req.cookies?.[ACCESS_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(unauthorized());
  let payload: AccessPayload;
  try { payload = verifyAccessToken(token); }
  catch { return next(unauthorized('Sessiya muddati tugagan. Qaytadan kiring')); }
  try {
    const user = await resolveAccessSession(payload);
    if (!user) return next(unauthorized('Sessiya bekor qilingan. Qaytadan kiring'));
    req.user = user;
    next();
  } catch (error) { next(error); }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden('Bu amal uchun ruxsat yo‘q'));
    next();
  };
}

/** Foydalanuvchi bor bo'lsa aniqlaydi, bo'lmasa ham o'tkazadi (ixtiyoriy auth). */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try { req.user = (await resolveAccessSession(verifyAccessToken(token))) ?? undefined; }
    catch { /* Public routes do not require a session. */ }
  }
  next();
}
