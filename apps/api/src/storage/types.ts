/**
 * Fayl saqlash adapteri. Hosting qarori (VPS diski yoki S3/R2) shu interfeys
 * ortida yashiringan — qolgan kod qaysi drayver ishlayotganini bilmaydi.
 */
export interface StorageDriver {
  /** Faylni saqlaydi va uni ochiq ko'rish uchun to'liq URL qaytaradi. */
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  /** Kalitdan ochiq URL yasaydi (fayl mavjudligini tekshirmaydi). */
  urlFor(key: string): string;
}
