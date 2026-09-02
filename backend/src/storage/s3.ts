import { env } from '../env.js';
import type { StorageDriver } from './types.js';

/**
 * S3-mos xotira (AWS S3, Cloudflare R2, DigitalOcean Spaces).
 *
 * `@aws-sdk/client-s3` **ixtiyoriy** bog'liqlik: STORAGE_DRIVER=local bilan
 * ishlaydigan o'rnatmalarda u umuman kerak emas va o'rnatilmaydi ham.
 * Shu sababli import qilinadigan modul nomi o'zgaruvchida saqlanadi —
 * TypeScript uni statik hal qilishga urinmaydi va paket yo'qligida ham
 * loyiha muvaffaqiyatli kompilyatsiya bo'ladi.
 */
const S3_MODULE = '@aws-sdk/client-s3';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface S3Module {
  S3Client: new (config: unknown) => { send(command: unknown): Promise<unknown> };
  PutObjectCommand: new (input: unknown) => unknown;
  DeleteObjectCommand: new (input: unknown) => unknown;
}

export class S3Driver implements StorageDriver {
  private modulePromise: Promise<S3Module> | null = null;
  private clientPromise: Promise<{ send(command: unknown): Promise<unknown> }> | null = null;

  private async loadModule(): Promise<S3Module> {
    if (!this.modulePromise) {
      this.modulePromise = (async () => {
        try {
          return (await import(S3_MODULE)) as unknown as S3Module;
        } catch {
          throw new Error(
            'STORAGE_DRIVER=s3 tanlangan, lekin @aws-sdk/client-s3 o‘rnatilmagan. ' +
              'Ishga tushiring: npm i @aws-sdk/client-s3 -w @ayntravel/api',
          );
        }
      })();
    }
    return this.modulePromise;
  }

  private async client() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { S3Client } = await this.loadModule();
        if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
          throw new Error('S3 sozlamalari to‘liq emas (S3_BUCKET va kalitlar kerak)');
        }
        return new S3Client({
          region: env.S3_REGION ?? 'auto',
          endpoint: env.S3_ENDPOINT,
          credentials: {
            accessKeyId: env.S3_ACCESS_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY,
          },
        });
      })();
    }
    return this.clientPromise;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    const [client, { PutObjectCommand }] = await Promise.all([this.client(), this.loadModule()]);
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Fayl nomida tasodifiy hash bor — mazmuni hech qachon o'zgarmaydi,
        // shuning uchun bir yillik immutable kesh xavfsiz.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return this.urlFor(key);
  }

  async delete(key: string): Promise<void> {
    const [client, { DeleteObjectCommand }] = await Promise.all([this.client(), this.loadModule()]);
    await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  }

  urlFor(key: string): string {
    return `${env.ASSET_BASE_URL.replace(/\/+$/, '')}/${key}`;
  }
}
