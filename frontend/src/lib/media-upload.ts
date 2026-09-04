'use client';

import { put } from '@vercel/blob/client';
import type { MediaDTO } from '@/shared';
import { adminClient } from './admin-client';

/**
 * Fayllarni Vercel Blob'ga yuklab, media ro'yxatiga qo'shadi.
 *
 * Uch qadam:
 *  1. serverdan qisqa muddatli yuklash tokeni olinadi (cookie bilan);
 *  2. fayl BRAUZERDAN to'g'ridan-to'g'ri Blob'ga ketadi;
 *  3. server tushgan faylni qayta ishlab (rasm bo'lsa — sharp bilan
 *     variantlarga) bazaga yozadi.
 *
 * Nima uchun fayl serverdan o'tmaydi: Vercel funksiyasiga kiruvchi
 * so'rov tanasi 4.5 MB bilan cheklangan. 12 MB rasm yoki 48 MB video
 * `/api/admin/media/upload` ga umuman yetib bormaydi.
 */

/** 8 MB dan katta fayl bo'laklab yuboriladi — uzilgan bo'lak qaytadan ketadi. */
const MULTIPART_THRESHOLD = 8 * 1024 * 1024;

interface VideoMeta {
  width: number;
  height: number;
  duration: number;
}

async function uploadOne(
  file: File,
  kind: 'IMAGE' | 'VIDEO',
  meta?: VideoMeta,
): Promise<MediaDTO[]> {
  const { token, pathname } = await adminClient.post<{ token: string; pathname: string }>(
    '/api/admin/media/upload-token',
    { kind, filename: file.name, contentType: file.type },
  );

  const blob = await put(pathname, file, {
    access: 'public',
    token,
    contentType: file.type,
    multipart: file.size > MULTIPART_THRESHOLD,
  });

  return adminClient.post<MediaDTO[]>('/api/admin/media/finalize', {
    kind,
    blobUrl: blob.url,
    originalName: file.name,
    ...(meta && {
      width: Math.round(meta.width),
      height: Math.round(meta.height),
      duration: Math.round(meta.duration),
    }),
  });
}

/** Bitta hero fon videosi. O'lchamlari brauzerda o'lchanadi — serverda ffmpeg yo'q. */
export function uploadVideo(file: File, meta: VideoMeta): Promise<MediaDTO[]> {
  return uploadOne(file, 'VIDEO', meta);
}

/**
 * Bir vaqtda 10 tagacha rasm.
 *
 * Ketma-ket: har bir rasm serverda 8 ta variantga (4 nisbat × 2 format)
 * qayta ishlanadi. Barchasini parallel yuborish funksiyani xotira va
 * vaqt limitiga uradi.
 */
export async function uploadImages(files: File[]): Promise<MediaDTO[]> {
  const created: MediaDTO[] = [];
  for (const file of files.slice(0, 10)) {
    created.push(...(await uploadOne(file, 'IMAGE')));
  }
  return created;
}
