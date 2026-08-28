import type { Locale, TourDTO } from '@ayntravel/shared';
import { TourCard } from '@/components/tour/TourCard';
import { RevealItem } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

interface TourGridProps {
  tours: TourDTO[];
  locale: Locale;
  /** Birinchi nechta rasm `priority` bilan yuklansin (LCP uchun). */
  priorityCount?: number;
  className?: string;
}

/**
 * Tur kartochkalari gridi. Kartochkalar 4:5 nisbatda bo'lgani uchun
 * grid Instagram lentasiga o'xshab ko'rinadi — bu ataylab shunday.
 *
 * `RevealGroup` ichida ishlatilsa kartochkalar navbat bilan paydo bo'ladi.
 */
export function TourGrid({ tours, locale, priorityCount = 0, className }: TourGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {tours.map((tour, index) => (
        <RevealItem key={tour.id}>
          <TourCard tour={tour} locale={locale} priority={index < priorityCount} />
        </RevealItem>
      ))}
    </div>
  );
}
