import { env } from '../env.js';
import { BlobDriver } from './blob.js';
import { LocalDriver } from './local.js';
import { S3Driver } from './s3.js';
import type { StorageDriver } from './types.js';

export type { StorageDriver };

const DRIVERS: Record<typeof env.STORAGE_DRIVER, () => StorageDriver> = {
  local: () => new LocalDriver(),
  s3: () => new S3Driver(),
  blob: () => new BlobDriver(),
};

/** STORAGE_DRIVER env qiymatiga qarab bitta drayver tanlanadi. */
export const storage: StorageDriver = DRIVERS[env.STORAGE_DRIVER]();
