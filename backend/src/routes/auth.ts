import { Router, type CookieOptions, type Response } from 'express';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { changePasswordSchema, loginSchema } from '../shared/index.js';
import { env, isProd } from '../env.js';
import { prisma } from '../db.js';
import { logger } from '../logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { badRequest, unauthorized } from '../utils/errors.js';
import { validate } from '../middleware/validate.js';
import { ACCESS_COOKIE, REFRESH_COOKIE, requireAuth } from '../middleware/auth.js';
import {
  consumeRefreshToken,
  issueRefreshToken,
  revokeRefreshToken,
  signAccessToken,
  verifyAccessToken,
  revokeSession,
} from '../services/tokens.js';
import { toUser } from '../services/dto.js';

export const authRouter: Router = Router();

/** Parol tanlash hujumlarini sekinlashtiradi: 15 daqiqada 10 urinish. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    ok: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Juda ko‘p urinish. 15 daqiqadan keyin qayta kiring' },
  },
});

/**
 * Cookie qamrovi joylashuvga qarab o'zgaradi.
 *
 * COOKIE_DOMAIN bor (api.ayntravel.uz + ayntravel.uz umumiy `.ayntravel.uz`):
 *   cookie same-site hisoblanadi, `lax` yetarli va CSRF'dan himoya qiladi.
 *
 * COOKIE_DOMAIN yo'q (frontend va API alohida `*.vercel.app` domenlarida):
 *   brauzer uchun bu cross-site, `lax` cookie umuman yuborilmaydi va
 *   admin panelga kirib bo'lmaydi — `none` + `secure` shart.
 *
 * Keyinchalik o'z domeningizga o'tsangiz faqat COOKIE_DOMAIN env'ini
 * qo'yish kifoya: kod o'zi qattiqroq rejimga qaytadi.
 */
function cookieOptions(maxAgeMs: number): CookieOptions {
  const crossSite = isProd && !env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    secure: isProd, // HTTPS'da faqat shifrlangan kanal orqali
    sameSite: crossSite ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/',
    maxAge: maxAgeMs,
  };
}

const REFRESH_MAX_AGE = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

function setAuthCookies(res: Response, access: string, refresh: string) {
  const expiresAt = (jwt.decode(access) as jwt.JwtPayload).exp ?? 0;
  res.cookie(ACCESS_COOKIE, access, cookieOptions(Math.max(0, expiresAt * 1000 - Date.now())));
  res.cookie(REFRESH_COOKIE, refresh, cookieOptions(REFRESH_MAX_AGE));
}

function clearAuthCookies(res: Response) {
  const opts = { ...cookieOptions(0), maxAge: undefined };
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}

authRouter.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Foydalanuvchi yo'q bo'lsa ham parolni tekshirgandek vaqt sarflaymiz —
    // javob tezligidan email mavjudligini aniqlab bo'lmasin.
    if (!user) {
      await argon2.hash(password).catch(() => undefined);
      throw unauthorized('Email yoki parol noto‘g‘ri');
    }
    if (!user.isActive) throw unauthorized('Hisob bloklangan');

    const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!valid) throw unauthorized('Email yoki parol noto‘g‘ri');

    const session = await issueRefreshToken(user.id, req.headers['user-agent']);
    const access = signAccessToken({ sub: user.id, email: user.email, role: user.role, sid: session.sid });
    setAuthCookies(res, access, session.raw);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    logger.info({ userId: user.id }, 'Foydalanuvchi tizimga kirdi');

    return ok(res, { user: toUser(user), accessToken: access });
  }),
);

/** Access token muddati tugaganda frontend shu endpointni chaqiradi. */
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (typeof raw !== 'string' || !raw) throw unauthorized('Sessiya topilmadi');

    const session = await consumeRefreshToken(raw);
    if (!session) {
      throw unauthorized('Sessiya muddati tugagan. Qaytadan kiring');
    }

    const user = session.user;
    const access = signAccessToken({ sub: user.id, email: user.email, role: user.role, sid: session.sid });
    setAuthCookies(res, access, session.raw);

    return ok(res, { user: toUser(user), accessToken: access });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const access = req.cookies?.[ACCESS_COOKIE];
    let session: ReturnType<typeof verifyAccessToken> | undefined;
    if (typeof access === 'string') {
      try { session = verifyAccessToken(access, true); } catch { /* Invalid tokens cannot select a session. */ }
    }
    if (session) await revokeSession(session.sid, session.sub);
    if (typeof raw === 'string' && raw) await revokeRefreshToken(raw);
    clearAuthCookies(res);
    return ok(res, { message: 'Tizimdan chiqdingiz' });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || !user.isActive) throw unauthorized();
    return ok(res, toUser(user));
  }),
);

authRouter.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw unauthorized();

    const valid = await argon2.verify(user.passwordHash, currentPassword).catch(() => false);
    if (!valid) throw badRequest('Joriy parol noto‘g‘ri');

    const passwordHash = await argon2.hash(newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    clearAuthCookies(res);

    return ok(res, { message: 'Parol o‘zgartirildi. Qaytadan kiring' });
  }),
);
