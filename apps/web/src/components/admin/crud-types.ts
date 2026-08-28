/** Maydon turlari — ro'yxat va forma komponentlari shu ta'rifni baham ko'radi. */
export type FieldType =
  | 'text'
  | 'password'
  | 'textarea'
  | 'html'
  | 'number'
  | 'slug'
  | 'checkbox'
  | 'select'
  | 'media';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  /** `true` bo'lsa maydon UZ/RU juftligi sifatida chiziladi (nameUz / nameRu). */
  bilingual?: boolean;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Slug uchun: qaysi maydondan avtomatik yaratilsin. */
  slugFrom?: string;
  defaultValue?: unknown;
  /** Ro'yxat qatorida qo'shimcha ma'lumot sifatida ko'rsatilsinmi. */
  inTable?: boolean;
}

export type Row = Record<string, unknown> & { id: string };

export const langSuffix = (lang: 'uz' | 'ru') => (lang === 'uz' ? 'Uz' : 'Ru');
