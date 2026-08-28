'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { ArrowRight, MoveHorizontal } from 'lucide-react';
import type { DestinationDTO, Locale } from '@ayntravel/shared';
import { pick } from '@ayntravel/shared';
import { Link } from '@/i18n/routing';
import { formatPrice } from '@/lib/format';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SmartImage } from '@/components/ui/SmartImage';

interface Props {
  destinations: DestinationDTO[];
  locale: Locale;
}

/** Bitta yo'nalish kartochkasi — ikkala rejimda ham bir xil ko'rinadi. */
function DestinationCard({
  destination,
  locale,
  priority,
}: {
  destination: DestinationDTO;
  locale: Locale;
  priority: boolean;
}) {
  const t = useTranslations('tour');
  const name = pick(destination as unknown as Record<string, unknown>, 'name', locale);

  return (
    <Link
      href={{ pathname: '/yonalishlar/[slug]', params: { slug: destination.slug } }}
      className="group relative block w-[72vw] shrink-0 overflow-hidden rounded-card sm:w-[42vw] lg:w-[26rem]"
    >
      {/* Rasm har doim to'q — ustidagi matn oq bo'lishi kerak */}
      <div data-tone="dark" className="relative aspect-[3/4] bg-navy-950">
        <SmartImage
          media={destination.heroImage}
          variant="poster"
          alt={name}
          locale={locale}
          priority={priority}
          className="transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 72vw, (max-width: 1024px) 42vw, 26rem"
        />
        <div className="overlay-gradient absolute inset-0" />

        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-display text-2xl font-bold text-ink sm:text-3xl">{name}</h3>

          <div className="mt-2 flex items-center justify-between gap-3">
            {destination.minPrice ? (
              <span className="text-sm font-bold text-accent">
                {t('from')} {formatPrice(destination.minPrice)}
              </span>
            ) : (
              <span className="text-xs text-ink/60">
                {destination.tourCount ?? 0} {locale === 'ru' ? 'туров' : 'ta tur'}
              </span>
            )}
            <ArrowRight
              className="size-5 shrink-0 text-accent transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Yo'nalishlar tasmasi.
 *
 * Katta ekranda vertikal scroll gorizontal harakatga aylanadi: bo'lim
 * ekranga yopishib turadi va kartochkalar yonlama siljiydi. Bu sayohat
 * saytining «yo'l» hissini beradi va odatiy griddan keskin ajralib turadi.
 *
 * MUHIM: mobil qurilmada va harakat kamaytirilganda bu effekt butunlay
 * o'chadi va oddiy barmoq bilan suriladigan tasmaga aylanadi. Sticky
 * scroll-jacking kichik ekranda sahifa «qotib qolgandek» tuyuladi va
 * vestibulyar buzilishi bor foydalanuvchilarga zarar beradi.
 */
export function DestinationsRail({ destinations, locale }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Server va mobil — oddiy tasma.
  const useScrollEffect = isDesktop && !reduced;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  // Ko'rinadigan kenglikdan tashqarida qolgan qismni siljitamiz.
  // 26rem kartochka + 1rem oraliq ≈ 27rem; ekranga ~3.5 tasi sig'adi.
  const shift = Math.max(0, destinations.length - 3) * 27;
  const x = useTransform(scrollYProgress, [0, 1], ['0rem', `-${shift}rem`]);

  if (destinations.length === 0) return null;

  if (!useScrollEffect) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-8">
          {destinations.map((destination, index) => (
            <div key={destination.id} className="snap-start">
              <DestinationCard
                destination={destination}
                locale={locale}
                priority={index < 2}
              />
            </div>
          ))}
        </div>

        <p className="mt-3 flex items-center gap-1.5 px-4 text-xs text-ink-subtle sm:px-6 lg:hidden">
          <MoveHorizontal className="size-3.5" aria-hidden="true" />
          {locale === 'ru' ? 'Листайте вбок' : 'Yonga suring'}
        </p>
      </div>
    );
  }

  return (
    // Balandlik = siljish masofasi + bitta ekran. Shu tufayli scroll
    // tugaguncha oxirgi kartochka ham ko'rinib ulguradi.
    <div ref={ref} style={{ height: `${shift * 0.75 + 100}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-4 pl-4 sm:pl-6 lg:pl-8">
          {destinations.map((destination, index) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              locale={locale}
              priority={index < 2}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
