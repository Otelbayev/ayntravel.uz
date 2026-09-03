'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * MUHIM: harakatni kamaytirish so'ralganda animatsiyani JS darajasida
 * o'chirish kerak.
 *
 * `globals.css` dagi `@media (prefers-reduced-motion: reduce)` qoidasi bu
 * yerda yordam bermaydi: Motion elementga inline `transform` va `opacity`
 * qiymatlarini har kadrda o'zi yozadi, CSS `transition-duration` esa bunga
 * ta'sir qilmaydi. Shuning uchun `useReducedMotion` bilan tekshirib,
 * kontentni darhol ko'rinadigan holatda chizamiz.
 */

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  /** Element ekranning qaysi qismiga kirganda ishga tushsin (0–1). */
  amount?: number;
  /** Qo'shimcha blur — kontent "fokusga kelgandek" chiqadi. */
  blur?: boolean;
}

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  amount = 0.25,
  blur = false,
}: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  const offset = OFFSET[direction];

  const variants: Variants = {
    hidden: { opacity: 0, x: offset.x, y: offset.y, ...(blur && { filter: 'blur(8px)' }) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      ...(blur && { filter: 'blur(0px)' }),
      transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      // `once` — animatsiya bir marta ishlaydi; har scrollda takrorlansa
      // sahifa bo'ylab yurish bezovta qiladi.
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Bolalarini navbat bilan chiqaradi — kartochkalar gridi uchun.
 * Har bir bola `RevealItem` bo'lishi kerak.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  // Ota `RevealGroup` ham oddiy div bo'lgani uchun bu yerda variantlar
  // ishlamaydi — shuning uchun bola ham oddiy div bo'lishi kerak.
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
