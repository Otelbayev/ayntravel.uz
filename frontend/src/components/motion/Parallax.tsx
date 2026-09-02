'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';

interface ParallaxProps {
  children: ReactNode;
  /** Qanchalik kuchli siljisin (piksel). Manfiy qiymat teskari yo'nalish. */
  distance?: number;
  className?: string;
}

/**
 * Scroll bo'yicha parallaks. Fon rasmi matndan sekinroq harakatlanadi —
 * hero blokiga chuqurlik hissi beradi.
 */
export function Parallax({ children, distance = 80, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

/** Scroll bilan yengil kattalashuvchi rasm konteyneri. */
export function ScrollScale({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1, 1.06]);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}
