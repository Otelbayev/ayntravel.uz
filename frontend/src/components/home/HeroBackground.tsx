'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Locale, ResolvedHeroBackground } from '@/shared';
import { SmartImage } from '@/components/ui/SmartImage';

interface Props {
  /** `undefined` — API o'chgan yoki hech narsa sozlanmagan: oddiy gradient. */
  config: ResolvedHeroBackground | undefined;
  locale: Locale;
}

/** `--ease-out-expo` bilan bir xil — dizayn tizimidagi asosiy egri chiziq. */
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Hero foni: gradient, rasm slayd-shousi yoki video.
 *
 * Barcha rejimlarda BAZAVIY GRADIENT birinchi chiziladi va hech qachon olib
 * tashlanmaydi — shu tufayli media yuklanmasa ham oq ekran ko'rinmaydi.
 */
export function HeroBackground({ config, locale }: Props) {
  const reduced = useReducedMotion();

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {/* Brend gradienti — kafolatlangan darhol bo'yash va universal zaxira */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950" />

      {config?.mode === 'slideshow' && (
        <Slideshow config={config} locale={locale} reduced={Boolean(reduced)} />
      )}
      {config?.mode === 'video' && (
        <VideoBackground config={config} locale={locale} reduced={Boolean(reduced)} />
      )}

      {config && config.mode !== 'gradient' && <Scrim opacity={config.overlayOpacity} />}
    </div>
  );
}

/**
 * Matn kontrasti.
 *
 * Ilgari butun kontrast navy gradientdan kelardi; rasm ustida u yo'q, shuning
 * uchun ikki qatlam: adminda sozlanadigan tekis parda va doimiy vertikal
 * gradient (yuqorida header, pastda scroll ishorasi har doim o'qilsin).
 */
function Scrim({ opacity }: { opacity: number }) {
  return (
    <>
      <div className="absolute inset-0 bg-navy-950" style={{ opacity }} />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-navy-950/40 to-navy-950/90" />
    </>
  );
}

/**
 * Slaydlar krossfeydi.
 *
 * BARCHA slaydlar bir vaqtda mount qilinadi (`AnimatePresence` emas): u
 * kiruvchi rasmni aynan fade boshlanganda mount qiladi va sekin internetda
 * bo'sh to'rtburchakka o'tib ketiladi. Hammasi mount bo'lsa brauzer ularni
 * oldindan, past prioritet bilan yuklaydi — shuning uchun slaydlar soni
 * `HERO_MAX_SLIDES` bilan cheklangan.
 */
function Slideshow({
  config,
  locale,
  reduced,
}: {
  config: ResolvedHeroBackground;
  locale: Locale;
  reduced: boolean;
}) {
  const slides = reduced ? config.slides.slice(0, 1) : config.slides;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || slides.length < 2) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), config.intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    // Boshqa tabda turganda taymer aylanishining hojati yo'q.
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced, slides.length, config.intervalMs]);

  const kenBurns = config.kenBurns && !reduced;

  return (
    <>
      {slides.map((slide, i) => (
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 1.1, ease: EASE }}
        >
          <motion.div
            className="absolute inset-0 will-change-transform"
            initial={false}
            animate={kenBurns ? { scale: i === index ? 1.08 : 1 } : undefined}
            transition={{ duration: config.intervalMs / 1000 + 1.1, ease: 'linear' }}
          >
            <SmartImage
              media={slide}
              variant="wide"
              alt=""
              locale={locale}
              // Faqat birinchi slayd LCP nomzodi — qolganlari fonda yuklanadi.
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      ))}
    </>
  );
}

/**
 * Fon videosi.
 *
 * Poster rasm SSR HTML'da chiziladi va hech qachon olib tashlanmaydi — LCP
 * elementi aynan u. `<video>` esa serverda umuman yo'q: gidratatsiyadan keyin
 * mount bo'ladi va `canplay` da yumshoq paydo bo'ladi. Ya'ni video baytlari
 * LCP'ni kechiktira olmaydi, video ochilmasa poster shunchaki qolaveradi.
 */
function VideoBackground({
  config,
  locale,
  reduced,
}: {
  config: ResolvedHeroBackground;
  locale: Locale;
  reduced: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reduced || !config.video) return;

    // Telefonlarda va tejamkor rejimda videoni umuman yuklamaymiz —
    // O'zbekistondagi mobil trafik uchun bu ataylab qilingan tanlov.
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    /*
     * Mount ataylab kechiktiriladi: brauzer avval poster rasmni chizib
     * bo'lsin, video so'ngra bo'sh vaqtda ulansin. Shu tufayli video
     * baytlari LCP bilan raqobatlashmaydi.
     */
    const idle =
      window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(cb, 200));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => setMounted(true));

    return () => cancel(handle as never);
  }, [reduced, config.video]);

  useEffect(() => {
    if (!mounted) return;
    // Safari gidratatsiyadan keyin qo'shilgan elementda avtoplay'ni ba'zan
    // rad etadi. Rad javobi yutiladi — poster o'z joyida qolaveradi.
    void videoRef.current?.play().catch(() => {});
  }, [mounted]);

  return (
    <>
      {config.poster && (
        <SmartImage
          media={config.poster}
          variant="wide"
          alt=""
          locale={locale}
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}

      {mounted && config.video && (
        <motion.video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          poster={config.poster?.variants.wide?.webp ?? config.poster?.url}
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          onCanPlay={() => setReady(true)}
          onError={() => setReady(false)}
          className="absolute inset-0 size-full object-cover"
        >
          <source src={config.video.src} type={config.video.mimeType ?? undefined} />
        </motion.video>
      )}
    </>
  );
}
