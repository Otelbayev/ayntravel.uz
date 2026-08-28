import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../env.js';
import type { StorageDriver } from './types.js';

/** Fayllarni serverning o'z diskiga yozadi — `uploads/` papkasiga. */
export class LocalDriver implements StorageDriver {
  private root = path.resolve(process.cwd(), env.UPLOAD_DIR);

  private resolve(key: string): string {
    const target = path.resolve(this.root, key);
    // Path traversal himoyasi: kalit hech qachon uploads papkasidan chiqmasin.
    if (!target.startsWith(this.root + path.sep) && target !== this.root) {
      throw new Error(`Xavfli fayl kaliti: ${key}`);
    }
    return target;
  }

  async put(key: string, body: Buffer): Promise<string> {
    const target = this.resolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, body);
    return this.urlFor(key);
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }

  urlFor(key: string): string {
    return `${env.ASSET_BASE_URL.replace(/\/+$/, '')}/${key}`;
  }
}
