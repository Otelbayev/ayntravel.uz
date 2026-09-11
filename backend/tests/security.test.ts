import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeCsvCell } from '../src/utils/csv.js';

// All database methods used by these tests are replaced; no database is contacted.
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: 'postgresql://test:test@localhost:1/test', JWT_ACCESS_SECRET: 'test-access-secret-that-is-at-least-32-characters', JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-characters' });
const { prisma } = await import('../src/db.js');
const tokens = await import('../src/services/tokens.js');
const receipts = await import('../src/services/upload-receipt.js');
const payload = { sub: 'user-1', email: 'admin@example.test', role: 'ADMIN' as const, sid: 'session-1' };

test('CSV export neutralizes formulas, whitespace prefixes and preserves ordinary text', () => {
  for (const value of ['=1+1', '+998901234567', '-2+1', '@SUM(A1)', ' \t=1+1', '\n=1']) assert.ok(escapeCsvCell(value).startsWith('"\''));
  assert.equal(escapeCsvCell('Ali "Vali"'), '"Ali ""Vali"""');
  assert.equal(escapeCsvCell(null), '""');
});

test('access tokens validate signature, audience and session identity', () => {
  const token = tokens.signAccessToken(payload);
  assert.equal(tokens.verifyAccessToken(token).sid, payload.sid);
  assert.throws(() => tokens.verifyAccessToken(`${token}x`));
  const receipt = receipts.signUploadReceipt({ sub: 'user-1', sid: 'session-1', kind: 'IMAGE', pathname: 'tmp/photo-test.jpg', contentType: 'image/jpeg', originalName: 'photo.jpg' });
  assert.throws(() => tokens.verifyAccessToken(receipt));
});

test('upload receipts reject altered tokens, different accounts, sessions, and published paths', () => {
  const data = { sub: 'user-1', sid: 'session-1', kind: 'IMAGE' as const, pathname: 'tmp/photo-test.jpg', contentType: 'image/jpeg', originalName: 'photo.jpg' };
  const token = receipts.signUploadReceipt(data);
  assert.equal(receipts.verifyUploadReceipt(token, 'user-1', 'session-1').pathname, data.pathname);
  assert.throws(() => receipts.verifyUploadReceipt(token, 'attacker', 'session-1'));
  assert.throws(() => receipts.verifyUploadReceipt(token, 'user-1', 'other-session'));
  assert.throws(() => receipts.verifyUploadReceipt(`${token}x`, 'user-1', 'session-1'));
  assert.throws(() => receipts.verifyUploadReceipt(receipts.signUploadReceipt({ ...data, pathname: '2026-09/published-poster.webp' }), 'user-1', 'session-1'));
});

test('bounded uploads reject oversized streamed bodies', async () => {
  assert.equal((await receipts.readBoundedBody(new Response('hello'), 5)).toString(), 'hello');
  await assert.rejects(receipts.readBoundedBody(new Response('too large'), 3), /size limit/);
  await assert.rejects(receipts.readBoundedBody(new Response(null, { status: 404 }), 10));
});

test('live session state enforces revocation, expiry, ownership and current role', async () => {
  const original = prisma.refreshToken.findUnique;
  let session: Record<string, unknown> | null = { id: 'session-1', userId: 'user-1', revokedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { id: 'user-1', email: 'current@example.test', role: 'MANAGER', isActive: true } };
  prisma.refreshToken.findUnique = (async () => session) as never;
  try {
    assert.equal((await tokens.resolveAccessSession(payload))?.role, 'MANAGER');
    assert.equal(await tokens.resolveAccessSession({ ...payload, sub: 'other-user' }), null);
    session.revokedAt = new Date();
    assert.equal(await tokens.resolveAccessSession(payload), null);
    session.revokedAt = null;
    session.expiresAt = new Date(0);
    assert.equal(await tokens.resolveAccessSession(payload), null);
    session.expiresAt = new Date(Date.now() + 60_000);
    (session.user as { isActive: boolean }).isActive = false;
    assert.equal(await tokens.resolveAccessSession(payload), null);
    session = null;
    assert.equal(await tokens.resolveAccessSession(payload), null);
  } finally { prisma.refreshToken.findUnique = original; }
});

test('concurrent refresh rotation has one winner and retains session id', async () => {
  const find = prisma.refreshToken.findUnique;
  const update = prisma.refreshToken.updateMany;
  let consumed = false;
  prisma.refreshToken.findUnique = (async () => ({ id: 'session-1', revokedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { isActive: true } })) as never;
  prisma.refreshToken.updateMany = (async ({ where, data }: { where: { id: string; tokenHash: string; revokedAt: unknown; expiresAt: unknown }; data: { tokenHash: string } }) => {
    assert.equal(where.id, 'session-1'); assert.equal(where.revokedAt, null); assert.ok(where.expiresAt); assert.notEqual(where.tokenHash, data.tokenHash);
    if (consumed) return { count: 0 };
    consumed = true; return { count: 1 };
  }) as never;
  try {
    const results = await Promise.all([tokens.consumeRefreshToken('old-secret'), tokens.consumeRefreshToken('old-secret')]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(results.find(Boolean)?.sid, 'session-1');
    assert.notEqual(results.find(Boolean)?.raw, 'old-secret');
  } finally { prisma.refreshToken.findUnique = find; prisma.refreshToken.updateMany = update; }
});
