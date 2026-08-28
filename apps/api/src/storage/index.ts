import { env } from '../env.js';
import { LocalDriver } from './local.js';
import { S3Driver } from './s3.js';
import type { StorageDriver } from './types.js';

export type { StorageDriver };

/** STORAGE_DRIVER env qiymatiga qarab bitta drayver tanlanadi. */
export const storage: StorageDriver =
  env.STORAGE_DRIVER === 's3' ? new S3Driver() : new LocalDriver();
