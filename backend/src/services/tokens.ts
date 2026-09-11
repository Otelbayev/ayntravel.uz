import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../shared/index.js';
import { env } from '../env.js';
import { prisma } from '../db.js';

export interface AccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  sid: string;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
    issuer: 'ayntravel-api',
    audience: 'ayntravel-admin',
  });
}

export function verifyAccessToken(token: string, forLogout = false): AccessPayload {
  const value = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'], issuer: 'ayntravel-api', audience: 'ayntravel-admin',
    ignoreExpiration: forLogout,
  });
  if (typeof value === 'string' || typeof value.sub !== 'string' || typeof value.sid !== 'string' || !value.sid) {
    throw new Error('Invalid access session');
  }
  return value as AccessPayload;
}

export async function resolveAccessSession(payload: AccessPayload): Promise<AccessPayload | null> {
  const session = await prisma.refreshToken.findUnique({ where: { id: payload.sid }, include: { user: true } });
  if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) return null;
  return { sub: session.user.id, email: session.user.email, role: session.user.role, sid: session.id };
}

export async function revokeSession(sid: string, userId: string) {
  await prisma.refreshToken.updateMany({ where: { id: sid, userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Refresh token bazada faqat hash ko'rinishida saqlanadi — baza sizib chiqsa ham
 * tokenlarni ishlatib bo'lmaydi.
 */
export async function issueRefreshToken(userId: string, userAgent?: string): Promise<{ raw: string; sid: string }> {
  const raw = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.refreshToken.create({
    data: { tokenHash: hash(raw), userId, expiresAt, userAgent: userAgent?.slice(0, 300) },
  });
  return { raw, sid: session.id };
}

export async function consumeRefreshToken(raw: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash(raw) },
    include: { user: true },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
  if (!record.user.isActive) return null;

  // Rotatsiya: eski token darhol bekor qilinadi, chaqiruvchi yangisini oladi.
  const nextRaw = crypto.randomBytes(48).toString('base64url');
  const result = await prisma.refreshToken.updateMany({
    where: { id: record.id, tokenHash: hash(raw), revokedAt: null, expiresAt: { gt: new Date() } },
    data: { tokenHash: hash(nextRaw), expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000) },
  });
  if (result.count !== 1) return null;
  return { user: record.user, raw: nextRaw, sid: record.id };
}

export async function revokeRefreshToken(raw: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash(raw), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllForUser(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Muddati o'tgan tokenlarni tozalaydi va o'chirilganlar sonini qaytaradi.
 * Lokalda `server.ts` startda va har 12 soatda, Vercel'da esa
 * `/api/cron/purge-tokens` orqali kuniga bir marta chaqiriladi.
 */
export async function purgeExpiredTokens(): Promise<number> {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
