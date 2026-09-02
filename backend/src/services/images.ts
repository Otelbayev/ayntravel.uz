import crypto from 'node:crypto';
import sharp from 'sharp';
import {
  IMAGE_VARIANTS,
  IMAGE_FORMATS,
  type ImageFormat,
  type ImageVariantName,
  type MediaVariants,
} from '../shared/index.js';
import { storage } from '../storage/index.js';
import { badRequest } from '../utils/errors.js';
import { logger } from '../logger.js';

export interface ProcessedImage {
  filename: string;
  width: number;
  height: number;
  sizeBytes: number;
  variants: MediaVariants;
  blurDataUrl: string;
  keys: string[];
}

const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
};

/** Bir xil nomli fayllar ustma-ust tushmasligi uchun tasodifiy kalit. */
function makeBaseName(originalName: string): string {
  const stem = originalName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const rand = crypto.randomBytes(6).toString('hex');
  return stem ? `${stem}-${rand}` : rand;
}

/**
 * Yuklangan rasmni saytga tayyor holga keltiradi:
 *  • 4 ta nisbat (4:5 poster, 1:1, 16:9, thumb) × 2 ta format (AVIF, WebP)
 *  • LQIP — `next/image` placeholder="blur" uchun kichik base64
 *
 * Nima uchun 4:5 birinchi o'rinda: AYN TRAVEL posterlari Instagram portret
 * formatida chizilgan, sayt kartochkalari ham aynan shu nisbatda ko'rsatiladi.
 */
export async function processImage(
  buffer: Buffer,
  originalName: string,
): Promise<ProcessedImage> {
  const base = sharp(buffer, { failOn: 'error' }).rotate(); // EXIF burilishini qo'llaydi
  const meta = await base.metadata();

  if (!meta.width || !meta.height) {
    throw badRequest('Rasmni o‘qib bo‘lmadi — fayl buzilgan bo‘lishi mumkin');
  }
  if (meta.width < 400 || meta.height < 400) {
    throw badRequest('Rasm juda kichik. Kamida 400×400 piksel bo‘lsin');
  }

  const baseName = makeBaseName(originalName);
  const dir = new Date().toISOString().slice(0, 7); // 2026-08 — oylik papkalar
  const variants: MediaVariants = {};
  const keys: string[] = [];
  let totalBytes = 0;

  for (const [name, size] of Object.entries(IMAGE_VARIANTS) as [
    ImageVariantName,
    { width: number; height: number },
  ][]) {
    for (const format of IMAGE_FORMATS) {
      const pipeline = sharp(buffer)
        .rotate()
        .resize({
          width: size.width,
          height: size.height,
          fit: 'cover',
          position: 'attention', // muhim qismni (yuz/matn) kesib tashlamaydi
          withoutEnlargement: true,
        });

      const out =
        format === 'avif'
          ? await pipeline.avif({ quality: 55, effort: 4 }).toBuffer()
          : await pipeline.webp({ quality: 82 }).toBuffer();

      const key = `${dir}/${baseName}-${name}.${format}`;
      const url = await storage.put(key, out, MIME_BY_FORMAT[format]);
      (variants[name] ??= {})[format] = url;
      keys.push(key);
      totalBytes += out.byteLength;
    }
  }

  // LQIP: 20px kenglikdagi blur — HTML ichida inline ketadi, shuning uchun juda kichik.
  const blurBuffer = await sharp(buffer)
    .rotate()
    .resize(20, 25, { fit: 'cover' })
    .webp({ quality: 30 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

  logger.debug({ baseName, files: keys.length, totalBytes }, 'Rasm qayta ishlandi');

  return {
    filename: `${dir}/${baseName}`,
    width: meta.width,
    height: meta.height,
    sizeBytes: totalBytes,
    variants,
    blurDataUrl,
    keys,
  };
}

/** Media o'chirilganda uning barcha fizik fayllarini ham o'chiradi. */
export async function deleteImageFiles(variants: MediaVariants): Promise<void> {
  const urls = Object.values(variants).flatMap((formats) => Object.values(formats ?? {}));
  await Promise.all(
    urls.map(async (url) => {
      try {
        // URL ichidan kalitni ajratib olamiz: .../uploads/2026-08/name-poster.webp
        const key = url.split('/').slice(-2).join('/');
        await storage.delete(key);
      } catch (err) {
        logger.warn({ err, url }, 'Fayl o‘chirilmadi');
      }
    }),
  );
}
