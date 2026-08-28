'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { compactNumber } from '@/lib/format';

interface CountUpProps {
  value: number;
  duration?: number;
  compact?: boolean;
  suffix?: string;
}

/**
 * Raqam ko'rinishga kirganda 0 dan qiymatgacha sanaladi.
 * Statistika blokida ishlatiladi (25.9K obunachi, 5000+ mijoz).
 */
export function CountUp({ value, duration = 1600, compact = true, suffix = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let frame = 0;

    // Harakat kamaytirilgan bo'lsa sanashsiz yakuniy qiymatni ko'rsatamiz.
    // `requestAnimationFrame` orqali — effekt tanasida sinxron `setState`
    // chaqirmaslik uchun (ortiqcha qayta render bo'lmasin).
    if (reduced) {
      frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // easeOutExpo — oxirida sekinlashadi, tabiiyroq ko'rinadi.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref}>
      {compact ? compactNumber(display) : display.toLocaleString('ru-RU')}
      {suffix}
    </span>
  );
}
