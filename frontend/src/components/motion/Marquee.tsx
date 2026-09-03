import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  /** Bir to'liq aylanish necha soniyada. */
  durationSeconds: number;
  /** `'right'` — teskari yo'nalish (ikki qatorli tasmalar uchun). */
  direction?: 'left' | 'right';
  className?: string;
  itemsClassName?: string;
}

/**
 * Uzluksiz gorizontal tasma.
 *
 * Kontent ikki marta chiziladi va lenta -50% ga suriladi — shu tufayli
 * aylanish uzilmaydi. Faqat `transform` animatsiya qilinadi, JS umuman
 * ishlamaydi, ya'ni bu server komponentida ham ishlaydi.
 *
 * Hover va klaviatura fokusida to'xtaydi: aks holda matnni o'qib bo'lmaydi.
 * `prefers-reduced-motion` da `globals.css` animatsiyani butunlay o'chiradi.
 */
export function Marquee({
  children,
  durationSeconds,
  direction = 'left',
  className,
  itemsClassName,
}: Props) {
  const row = (ariaHidden: boolean) => (
    <div
      className={cn('flex shrink-0 items-stretch', itemsClassName)}
      aria-hidden={ariaHidden || undefined}
      // Nusxa faqat vizual — klaviatura u orqali yurmasligi kerak.
      inert={ariaHidden}
    >
      {children}
    </div>
  );

  return (
    <div className={cn('group/marquee relative overflow-hidden', className)}>
      <div
        className={cn(
          'animate-marquee flex w-max',
          direction === 'right' && '[animation-direction:reverse]',
          'hover:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused]',
        )}
        style={{ ['--marquee-duration' as string]: `${durationSeconds}s` }}
      >
        {/* Birinchi nusxa — skrinrider va qidiruv shuni o'qiydi */}
        {row(false)}
        {/* Ikkinchi nusxa — faqat uzluksiz aylanish uchun */}
        {row(true)}
      </div>
    </div>
  );
}
