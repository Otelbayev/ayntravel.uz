'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Kursor ortidan yuradigan oltin yorug'lik.
 *
 * Kartochkalar "tirik" tuyulishi uchun — oddiy `hover:bg-*` dan farqli
 * ravishda effekt sichqoncha qayerda turganiga bog'liq.
 *
 * Koordinatalar `useMotionValue` da saqlanadi, ya'ni har harakatda React
 * qayta chizmaydi — faqat CSS o'zgaruvchisi yangilanadi.
 */
export function Spotlight({
  children,
  className,
  radius = 320,
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);

  const background = useMotionTemplate`radial-gradient(${radius}px circle at ${x}px ${y}px, rgb(212 175 55 / 0.14), transparent 70%)`;

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div
      ref={ref}
      className={cn('group/spot relative', className)}
      onPointerMove={(event) => {
        // Sensorli qurilmada "hover" tushunchasi yo'q — effekt o'tkazib yuboriladi.
        if (event.pointerType !== 'mouse') return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
      }}
      onPointerLeave={() => {
        x.set(-9999);
        y.set(-9999);
      }}
    >
      <motion.div
        aria-hidden="true"
        style={{ background }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
      />
      {children}
    </div>
  );
}
