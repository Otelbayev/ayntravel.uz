import { Plane } from 'lucide-react';
import type { Locale, TourDTO } from '@ayntravel/shared';
import { pick } from '@ayntravel/shared';
import { Link } from '@/i18n/routing';
import { formatDate, formatPrice } from '@/lib/format';

interface Props {
  tours: TourDTO[];
  locale: Locale;
}

/**
 * Aylanuvchi narx tasmasi — hero ostidagi ingichka to'q chiziq.
 *
 * Nega kerak: mijoz saytga kirgan zahoti «qanchaga?» degan savolga javob
 * oladi, hech qayerga bosmasdan. Instagram'da narx posterda yozilgan —
 * bu shu odatning saytdagi ekvivalenti.
 *
 * Texnik jihati: kontent ikki marta chiziladi va lenta -50% ga suriladi,
 * shuning uchun aylanish uzluksiz ko'rinadi. Faqat `transform` animatsiya
 * qilinadi — layout qayta hisoblanmaydi, JS umuman ishlamaydi.
 * `prefers-reduced-motion` da animatsiya to'xtaydi (globals.css) va tasma
 * oddiy gorizontal ro'yxatga aylanadi.
 */
export function PriceTicker({ tours, locale }: Props) {
  if (tours.length === 0) return null;

  // Tasma juda tez tugamasligi uchun kamida 8 ta element bo'lsin.
  const items = tours.length >= 8 ? tours : [...tours, ...tours, ...tours].slice(0, 8);

  // Tezlik elementlar soniga bog'liq: har biri ~5 soniyada o'tadi.
  const duration = `${items.length * 5}s`;

  const row = (ariaHidden: boolean) => (
    <ul
      className="flex shrink-0 items-center gap-8 px-4"
      aria-hidden={ariaHidden || undefined}
    >
      {items.map((tour, index) => {
        const title = pick(tour as unknown as Record<string, unknown>, 'title', locale);
        const destination = tour.destination
          ? pick(tour.destination as unknown as Record<string, unknown>, 'name', locale)
          : title;

        return (
          <li key={`${tour.id}-${index}`} className="flex shrink-0 items-center gap-2.5">
            <Plane className="size-3.5 shrink-0 text-gold-300" aria-hidden="true" />
            <Link
              href={{ pathname: '/turlar/[slug]', params: { slug: tour.slug } }}
              className="text-sm whitespace-nowrap text-ink/80 transition-colors hover:text-ink"
              tabIndex={ariaHidden ? -1 : undefined}
            >
              <span className="font-medium">{destination}</span>
              <span className="mx-1.5 text-ink/30">·</span>
              <span className="font-display font-bold text-gold-300">
                {formatPrice(tour.priceFrom, tour.currency)}
              </span>
              {tour.departureDate && (
                <>
                  <span className="mx-1.5 text-ink/30">·</span>
                  <span className="text-ink/55">{formatDate(tour.departureDate, locale)}</span>
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className="relative overflow-hidden border-y border-line bg-navy-950 py-3"
      // Tasma to'q — sahifaning oq qismidan hero'ga o'tishni yumshatadi.
      data-tone="dark"
    >
      {/* Chetlarda soyalar — matn keskin kesilmasdan so'nib boradi */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-navy-950 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-navy-950 to-transparent"
        aria-hidden="true"
      />

      <div
        className="animate-marquee flex w-max"
        style={{ ['--marquee-duration' as string]: duration }}
      >
        {/* Birinchi nusxa — skrinrider va qidiruv shuni o'qiydi */}
        {row(false)}
        {/* Ikkinchi nusxa — faqat uzluksiz aylanish uchun, takror o'qilmaydi */}
        {row(true)}
      </div>
    </div>
  );
}
