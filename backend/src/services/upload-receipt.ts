import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../env.js';

const receiptSchema = z.object({
  sub: z.string().min(1), sid: z.string().min(1), kind: z.enum(['IMAGE', 'VIDEO']),
  pathname: z.string().min(1), contentType: z.string().min(1), originalName: z.string().min(1).max(200),
});
export type UploadReceipt = z.infer<typeof receiptSchema>;
export function signUploadReceipt(value: UploadReceipt): string {
  return jwt.sign(receiptSchema.parse(value), env.JWT_ACCESS_SECRET, { algorithm: 'HS256', issuer: 'ayntravel-api', audience: 'ayntravel-media-upload', expiresIn: '15m' });
}
export function verifyUploadReceipt(token: string, userId: string, sessionId: string): UploadReceipt {
  const receipt = receiptSchema.parse(jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'], issuer: 'ayntravel-api', audience: 'ayntravel-media-upload' }));
  if (receipt.sub !== userId || receipt.sid !== sessionId) throw new Error('Upload belongs to another session');
  const path = receipt.kind === 'IMAGE' ? /^tmp\/[a-zA-Z0-9_-]+\.(jpg|png|webp|avif)$/ : /^\d{4}-\d{2}\/[a-zA-Z0-9_-]+\.(mp4|webm)$/;
  if (!path.test(receipt.pathname)) throw new Error('Invalid upload path');
  return receipt;
}

export async function readBoundedBody(response: Response, maxBytes: number): Promise<Buffer> {
  if (!response.ok || !response.body) throw new Error('Upload is not readable');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error('Upload exceeds size limit'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}
