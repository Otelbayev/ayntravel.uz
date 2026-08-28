import type { Locale, TourDTO } from '@ayntravel/shared';
import { TourCard } from '@/components/tour/TourCard';
import { RevealItem } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

interface Props {
  tours: TourDTO[];
  locale: Locale;
  className?: string;
}

/**
 * Bento grid — bir xil o'lchamdagi kartochkalar o'rniga aralash tuzilma:
 * birinchi tur katta (ikki ustun, ikki qator), qolganlari kichik.
 *
 * Nega: bir tekis grid arzon shablon saytlarga o'xshaydi va barcha turlar
 * teng ahamiyatga egadek ko'rinadi. Bento esa eng muhim taklifni (odatda
 * eng yaqin sanadagi goryashiy tur) darhol ajratib ko'rsatadi — bu Instagram
 * lentasining «birinchi post eng muhimi» mantig'ini takrorlaydi.
 *
 * Mobil'da grid oddiy bitta ustunga tushadi: kichik ekranda bento kataklari
 * o'qilmas darajada siqilib ketadi.
 */
export function BentoTours({ tours, locale, className }: Props) {
  if (tours.length === 0) return null;

  const [featured, ...rest] = tours;
  // Katta katak 2×2 joy egallaydi, shuning uchun yoniga 4 tasi sig'adi.
  const small = rest.slice(0, 4);

  // Bitta turgina bo'lsa bento mantiqsiz — oddiy kartochka chiziladi.
  if (small.length === 0) {
    return (
      <div className={cn('mx-auto max-w-md', className)}>
        <RevealItem>
          <TourCard tour={featured} locale={locale} priority sizes="(max-width: 768px) 92vw, 28rem" />
        </RevealItem>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2',
        className,
      )}
    >
      {/* Asosiy taklif — ikki ustun, ikki qator */}
      <RevealItem className="lg:col-span-2 lg:row-span-2">
        <TourCard
          tour={featured}
          locale={locale}
          size="lg"
          priority
          className="h-full"
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 46vw"
        />
      </RevealItem>

      {small.map((tour, index) => (
        <RevealItem key={tour.id}>
          <TourCard
            tour={tour}
            locale={locale}
            // Faqat birinchi kichik kartochka LCP'ga ta'sir qilishi mumkin
            priority={index === 0}
            className="h-full"
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw"
          />
        </RevealItem>
      ))}
    </div>
  );
}
