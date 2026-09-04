import { put, del } from '@vercel/blob';
import { env } from '../env.js';
import type { StorageDriver } from './types.js';

/**
 * Vercel Blob — serverless uchun yagona ishlaydigan variant.
 *
 * Vercel funksiyalarida disk read-only, shuning uchun `LocalDriver`
 * u yerda umuman ishlamaydi. Blob store'ni loyihaga ulaganda
 * `BLOB_READ_WRITE_TOKEN` env avtomatik qo'shiladi — SDK uni o'zi oladi.
 */
export class BlobDriver implements StorageDriver {
  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    const blob = await put(key, body, {
      access: 'public',
      contentType,
      /*
       * MUHIM: tasodifiy suffiks BO'LMASIN.
       *
       * `deleteImageFiles` va `deleteVideoFile` saqlash kalitini URL
       * oxiridagi ikki bo'lakdan tiklaydi (`2026-09/nom-poster.webp`).
       * Suffiks qo'shilsa URL kalitdan farq qiladi va o'chirish jimgina
       * ishlamay qo'yadi — fayllar store'da abadiy qolib ketadi.
       * Nom ichida allaqachon 6 baytlik tasodifiy hash bor (`makeBaseName`),
       * shuning uchun to'qnashuv xavfi yo'q.
       */
      addRandomSuffix: false,
      // Qayta yuklashda xato bermasin (masalan tarmoq uzilib, urinish takrorlansa).
      allowOverwrite: true,
      // Fayl nomi mazmuniga bog'langan — mazmuni hech qachon o'zgarmaydi.
      cacheControlMaxAge: 31536000,
    });
    return blob.url;
  }

  async delete(key: string): Promise<void> {
    await del(this.urlFor(key));
  }

  urlFor(key: string): string {
    return `${env.ASSET_BASE_URL.replace(/\/+$/, '')}/${key}`;
  }
}
