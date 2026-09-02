import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../shared/index.js';
import { env } from '../env.js';
import { prisma } from '../db.js';

export interface AccessPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

/**
 * Refresh token bazada faqat hash ko'rinishida saqlanadi — baza sizib chiqsa ham
 * tokenlarni ishlatib bo'lmaydi.
 */
export async function issueRefreshToken(userId: string, userAgent?: string): Promise<string> {
  const raw = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { tokenHash: hash(raw), userId, expiresAt, userAgent: userAgent?.slice(0, 300) },
  });
  return raw;
}

export async function consumeRefreshToken(raw: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash(raw) },
    include: { user: true },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) return null;
  if (!record.user.isActive) return null;

  // Rotatsiya: eski token darhol bekor qilinadi, chaqiruvchi yangisini oladi.
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });
  return record.user;
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

/** Muddati o'tgan tokenlarni tozalash (server startida chaqiriladi). */
export async function purgeExpiredTokens() {
  await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
