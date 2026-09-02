import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../shared/index.js';
import { verifyAccessToken, type AccessPayload } from '../services/tokens.js';
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

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(unauthorized());
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(unauthorized('Sessiya muddati tugagan. Qaytadan kiring'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden('Bu amal uchun ruxsat yo‘q'));
    next();
  };
}

/** Foydalanuvchi bor bo'lsa aniqlaydi, bo'lmasa ham o'tkazadi (ixtiyoriy auth). */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      /* e'tiborsiz qoldiriladi */
    }
  }
  next();
}
