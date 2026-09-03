'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';
import type { DestinationDTO, Locale } from '@/shared';
import { pick } from '@/shared';
import { Link } from '@/i18n/routing';
import { formatPrice } from '@/lib/format';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn } from '@/lib/utils';

interface Props {
  destinations: DestinationDTO[];
  locale: Locale;
}

/** Bitta yo'nalish kartochkasi. */
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
  const count = destination.tourCount ?? 0;

  return (
    <Link
      href={{ pathname: '/yonalishlar/[slug]', params: { slug: destination.slug } }}
      className="group relative block w-[72vw] shrink-0 snap-start overflow-hidden rounded-card sm:w-[42vw] lg:w-[26rem]"
    >
      {/* Rasm har doim to'q — ustidagi matn oq bo'lishi kerak */}
      <div data-tone="dark" className="relative aspect-[3/4] bg-navy-950">
        <SmartImage
          media={destination.heroImage}
          variant="square"
          alt={name}
          locale={locale}
          priority={priority}
          className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
          sizes="(max-width: 640px) 72vw, (max-width: 1024px) 42vw, 26rem"
        />
        <div className="overlay-gradient absolute inset-0" />

        {/* Oltin chegara faqat hoverda — kartochka "ko'tarilgandek" tuyuladi */}
        <div className="pointer-events-none absolute inset-0 rounded-card ring-1 ring-white/10 transition-colors duration-300 group-hover:ring-gold-500/60" />

        {count > 0 && (
          <span className="absolute top-4 right-4 rounded-full bg-navy-950/70 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur-sm">
            {count} {locale === 'ru' ? 'туров' : 'ta tur'}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="font-display text-2xl font-bold text-ink sm:text-3xl">{name}</h3>

          <div className="mt-2 flex items-center justify-between gap-3">
            {destination.minPrice ? (
              <span className="text-sm font-bold text-accent">
                {t('from')} {formatPrice(destination.minPrice)}
              </span>
            ) : (
              <span className="text-xs text-ink/60">
                {locale === 'ru' ? 'Скоро' : 'Tez orada'}
              </span>
            )}
            <ArrowRight
              className="size-5 shrink-0 text-accent transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </div>

          {/* Oltin chiziq chapdan chiziladi — kartochka "ochilgandek" bo'ladi */}
          <span className="mt-3 block h-px origin-left scale-x-0 bg-gradient-to-r from-gold-500 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
        </div>
      </div>
    </Link>
  );
}

/**
 * Yo'nalishlar tasmasi.
 *
 * MUHIM: bu blok serverda va brauzerda AYNAN bir xil chiziladi. Ilgari
 * desktopda `sticky` scroll-jacking ishlatilardi: u ~282vh balandlik talab
 * qilar, `useMediaQuery` serverda `false` qaytargani uchun gidratatsiyada
 * barcha kartochkalar qaytadan chizilar va sahifa sakrar edi.
 *
 * Endi bitta snap-tasma: mobilda barmoq bilan, desktopda tugmalar bilan
 * suriladi. Jonlilik effekti kartochkaning o'zida (hover, oltin chiziq).
 */
export function DestinationsRail({ destinations, locale }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    // 8px — subpiksel yaxlitlash uchun zaxira; aks holda oxirgi holat "tutilmaydi".
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    syncEdges();
    const el = scrollerRef.current;
    if (!el) return;
    window.addEventListener('resize', syncEdges);
    return () => window.removeEventListener('resize', syncEdges);
  }, [syncEdges]);

  function scrollByCards(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    // Ko'rinadigan kenglikning ~85% — keyingi kartochka chetda qolib turadi
    // va foydalanuvchi davomi borligini ko'radi.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  }

  if (destinations.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={syncEdges}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-8"
      >
        {destinations.map((destination, index) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
            locale={locale}
            // Faqat birinchisi — qolganlari ekrandan tashqarida va hero bilan
            // kanal uchun raqobatlashmasligi kerak.
            priority={index === 0}
          />
        ))}
      </div>

      {/* Chetlardagi so'nish — kartochkalar keskin kesilmasin */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface-sunken to-transparent transition-opacity duration-300',
          atStart && 'opacity-0',
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface-sunken to-transparent transition-opacity duration-300',
          atEnd && 'opacity-0',
        )}
      />

      {/* Desktopda tugmalar, mobilda barmoq bilan suriladi */}
      <div className="mt-5 hidden items-center gap-2 px-4 sm:px-6 lg:flex lg:px-8">
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          disabled={atStart}
          aria-label={locale === 'ru' ? 'Назад' : 'Orqaga'}
          className="flex size-11 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-gold-500/60 hover:text-accent disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          disabled={atEnd}
          aria-label={locale === 'ru' ? 'Вперёд' : 'Oldinga'}
          className="flex size-11 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-gold-500/60 hover:text-accent disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <p className="mt-3 flex items-center gap-1.5 px-4 text-xs text-ink-subtle sm:px-6 lg:hidden">
        <MoveHorizontal className="size-3.5" aria-hidden="true" />
        {locale === 'ru' ? 'Листайте вбок' : 'Yonga suring'}
      </p>
    </div>
  );
}
