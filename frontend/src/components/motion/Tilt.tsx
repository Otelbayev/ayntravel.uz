'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

/**
 * Kursor bo'yicha yumshoq 3D egilish.
 *
 * Burchak ataylab kichik (±6°): kattaroq qiymatda matn qiyshayib o'qilmay
 * qoladi va effekt arzon ko'rinadi.
 *
 * Sensorli qurilmada va harakat kamaytirilganda oddiy `div` qaytariladi —
 * `pointerType` tekshiruvi bu yerda kamlik qiladi, chunki `perspective`
 * o'zi ham render qatlamini o'zgartiradi.
 */
export function Tilt({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // -0.5..0.5 — markazdan nisbiy siljish.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), spring);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={className} style={{ perspective: 900 }}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse') return;
          const rect = ref.current?.getBoundingClientRect();
          if (!rect) return;
          px.set((event.clientX - rect.left) / rect.width - 0.5);
          py.set((event.clientY - rect.top) / rect.height - 0.5);
        }}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
        className="size-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
