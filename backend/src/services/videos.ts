import { storage } from '../storage/index.js';
import { logger } from '../logger.js';
import { makeBaseName } from './images.js';

export interface StoredVideo {
  /** Media.filename (@unique) — kengaytmasiz, rasmlardagidek. */
  filename: string;
  /** Saqlash kaliti — `2026-09/hero-loop-ab12cd.mp4`. */
  key: string;
  sourceUrl: string;
  sizeBytes: number;
}

/**
 * Hero fon videosini saqlaydi.
 *
 * Rasmdan farqli — hech qanday qayta ishlash yo'q: serverda ffmpeg yo'q va
 * qo'shilmaydi ham. Fayl qanday kelsa shunday yoziladi, o'lchamlari esa
 * brauzer tomonidan o'lchanib, alohida maydonlarda keladi.
 *
 * MUHIM: kalit ikki segmentli bo'lishi SHART (`YYYY-MM/nom.mp4`) — o'chirish
 * `deleteVideoFile` va `deleteImageFiles` da URL oxiridagi ikki bo'lakdan
 * tiklanadi.
 */
export async function storeVideo(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredVideo> {
  const baseName = makeBaseName(originalName);
  const dir = new Date().toISOString().slice(0, 7); // 2026-09 — oylik papkalar
  const ext = mimeType === 'video/webm' ? 'webm' : 'mp4';

  const key = `${dir}/${baseName}.${ext}`;
  const sourceUrl = await storage.put(key, buffer, mimeType);

  logger.debug({ key, sizeBytes: buffer.byteLength }, 'Video saqlandi');

  return { filename: `${dir}/${baseName}`, key, sourceUrl, sizeBytes: buffer.byteLength };
}

/** Video media o'chirilganda fizik faylni ham o'chiradi. */
export async function deleteVideoFile(sourceUrl: string | null): Promise<void> {
  if (!sourceUrl) return;
  try {
    // URL ichidan kalitni ajratib olamiz: .../uploads/2026-09/name.mp4
    const key = sourceUrl.split('/').slice(-2).join('/');
    await storage.delete(key);
  } catch (err) {
    logger.warn({ err, sourceUrl }, 'Video fayl o‘chirilmadi');
  }
}
