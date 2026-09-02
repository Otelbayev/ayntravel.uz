import { useTranslations } from 'next-intl';
import { Calendar, Clock, MapPin, Star } from 'lucide-react';
import type { Locale, TourDTO } from '@/shared';
import { pick, pickArray } from '@/shared';
import { Link } from '@/i18n/routing';
import { formatDate, formatDuration, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SmartImage } from '@/components/ui/SmartImage';
import { Badge } from '@/components/ui/Badge';

interface TourCardProps {
  tour: TourDTO;
  locale: Locale;
  priority?: boolean;
  className?: string;
  /**
   * Kartochka o'lchami. `lg` — bento gridning katta katagi uchun:
   * poster kengroq nisbatda va matn yirikroq bo'ladi.
   */
  size?: 'md' | 'lg';
  /** Rasm o'lchamlari haqida brauzerga ishora — bento'da grid boshqacha. */
  sizes?: string;
}

/**
 * Saytning asosiy vizual elementi.
 *
 * Nisbat qat'iy 4:5 — AYN TRAVEL posterlarining Instagram formati.
 * Admin yuklagan poster to'liq fon bo'lib, ustiga gradient va oltin narx
 * bloki tushadi. Bunday kartochkalar gridi ularning IG lentasidek ko'rinadi.
 *
 * Komponent sinxron (async emas): shunda uni ham server, ham klient
 * daraxtiga qo'yish mumkin. next-intl `useTranslations` server
 * komponentlarida ham to'g'ri ishlaydi.
 */
export function TourCard({
  tour,
  locale,
  priority = false,
  className,
  size = 'md',
  sizes,
}: TourCardProps) {
  const isLarge = size === 'lg';
  const t = useTranslations('tour');
  const record = tour as unknown as Record<string, unknown>;

  const title = pick(record, 'title', locale);
  const summary = pick(record, 'summary', locale);
  const cities = pickArray(record, 'cities', locale);
  const destination = tour.destination
    ? pick(tour.destination as unknown as Record<string, unknown>, 'name', locale)
    : null;

  const duration = formatDuration(tour.durationDays, tour.durationNights, locale);
  const lowSeats = tour.seatsLeft !== null && tour.seatsLeft > 0 && tour.seatsLeft <= 5;

  return (
    <Link
      href={{ pathname: '/turlar/[slug]', params: { slug: tour.slug } }}
      className={cn(
        'group relative block overflow-hidden rounded-card border border-line bg-surface-raised',
        'transition-all duration-500 hover:border-gold-500/40 hover:shadow-2xl hover:shadow-gold-500/10',
        className,
      )}
    >
      {/*
        Instagram portret nisbati.
        `data-tone="dark"` — poster rasmi va uning ustidagi gradient HAR DOIM to'q,
        shuning uchun sahifa oq bo'lsa ham bu qism ichida `text-ink` oq,
        `text-accent` esa yorqin oltin bo'lishi kerak.
      */}
      <div
        data-tone="dark"
        className={cn(
          'relative overflow-hidden bg-navy-950',
          // Katta katakda poster balandroq emas, kengroq: bento ustunini
          // to'liq egallaydi va yonidagi kichik kartochkalar bilan tenglashadi.
          isLarge ? 'aspect-[4/5] sm:aspect-[3/4]' : 'aspect-[4/5]',
        )}
      >
        <SmartImage
          media={tour.posterImage}
          variant="poster"
          alt={title}
          locale={locale}
          priority={priority}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          sizes={sizes ?? '(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw'}
        />

        {/* Matn o'qilishi uchun pastdan yuqoriga gradient */}
        <div className="overlay-gradient absolute inset-0" />

        {/* Yuqori bejlar */}
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {tour.isHot && <Badge variant="hot">🔥 {t('hot')}</Badge>}
            {lowSeats && <Badge variant="neutral">{t('lastSeats')}</Badge>}
          </div>
          {tour.departureDate && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-navy-950/70 px-3 py-1.5 text-xs font-bold text-ink backdrop-blur-sm">
              <Calendar className="size-3.5 text-accent" aria-hidden="true" />
              {formatDate(tour.departureDate, locale)}
            </span>
          )}
        </div>

        {/* Pastki kontent */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          {destination && (
            <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
              <MapPin className="size-3.5" aria-hidden="true" />
              {destination}
            </span>
          )}

          <h3
            className={cn(
              'font-display leading-tight font-extrabold text-ink',
              isLarge ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl',
            )}
          >
            {title}
          </h3>

          {cities.length > 0 && (
            <p className="mt-1.5 line-clamp-1 text-sm text-ink/70">{cities.join(' • ')}</p>
          )}

          {/* Katta katakda joy yetarli — tavsifni ham ko'rsatamiz */}
          {isLarge && summary && (
            <p className="mt-2 line-clamp-2 max-w-md text-sm text-ink/70">{summary}</p>
          )}

          {/* Meta qatori */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/75">
            {duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {duration}
              </span>
            )}
            {tour.hotelStars && (
              <span className="flex items-center gap-1" aria-label={`${tour.hotelStars} ${t('stars')}`}>
                {Array.from({ length: tour.hotelStars }).map((_, i) => (
                  <Star key={i} className="size-3 fill-gold-300 text-accent" aria-hidden="true" />
                ))}
              </span>
            )}
            {tour.mealPlan && (
              <span className="rounded bg-ink/10 px-1.5 py-0.5 font-semibold">
                {tour.mealPlan}
              </span>
            )}
          </div>

          {/* Narx bloki — posterlardagi oltin ramkali blok uslubida */}
          <div className="mt-4 flex items-end justify-between gap-3 border-t border-line-strong pt-4">
            <div>
              <span className="block text-[11px] tracking-wide text-ink/60 uppercase">
                {t('from')}
              </span>
              <span
                className={cn(
                  'text-gold-gradient font-display leading-none font-black',
                  isLarge ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl',
                )}
              >
                {formatPrice(tour.priceFrom, tour.currency)}
              </span>
              <span className="mt-0.5 block text-[11px] text-ink/55">{t('perPerson')}</span>
            </div>

            <span className="rounded-lg border border-gold-500/40 px-3 py-2 text-xs font-bold text-accent transition-colors group-hover:bg-gold-500 group-hover:text-navy-950">
              {t('book')}
            </span>
          </div>
        </div>
      </div>

      {/* Kichik kartochkada tavsif ko'rinmaydi — skrinrider uchun qoldiramiz */}
      {summary && !isLarge && <span className="sr-only">{summary}</span>}
    </Link>
  );
}
