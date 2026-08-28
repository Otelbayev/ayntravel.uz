import { Router, type CookieOptions, type Response } from 'express';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import { changePasswordSchema, loginSchema } from '@ayntravel/shared';
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
  revokeAllForUser,
  revokeRefreshToken,
  signAccessToken,
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

function cookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd, // HTTPS'da faqat shifrlangan kanal orqali
    sameSite: 'lax', // admin panel bir domenda — 'lax' yetarli va CSRF'dan himoya qiladi
    domain: env.COOKIE_DOMAIN,
    path: '/',
    maxAge: maxAgeMs,
  };
}

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

function setAuthCookies(res: Response, access: string, refresh: string) {
  res.cookie(ACCESS_COOKIE, access, cookieOptions(ACCESS_MAX_AGE));
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

    const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refresh = await issueRefreshToken(user.id, req.headers['user-agent']);
    setAuthCookies(res, access, refresh);

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

    const user = await consumeRefreshToken(raw);
    if (!user) {
      clearAuthCookies(res);
      throw unauthorized('Sessiya muddati tugagan. Qaytadan kiring');
    }

    const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refresh = await issueRefreshToken(user.id, req.headers['user-agent']);
    setAuthCookies(res, access, refresh);

    return ok(res, { user: toUser(user), accessToken: access });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
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

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await argon2.hash(newPassword) },
    });

    // Parol o'zgargach barcha eski sessiyalar bekor qilinadi.
    await revokeAllForUser(user.id);
    clearAuthCookies(res);

    return ok(res, { message: 'Parol o‘zgartirildi. Qaytadan kiring' });
  }),
);
