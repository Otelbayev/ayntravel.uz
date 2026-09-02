import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind sinflarini xavfsiz birlashtiradi (keyingisi oldingisini bekor qiladi). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
