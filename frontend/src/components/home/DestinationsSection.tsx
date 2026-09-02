import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import type { DestinationDTO, Locale } from '@/shared';
import { pick } from '@/shared';
import { Link } from '@/i18n/routing';
import { formatPrice } from '@/lib/format';
import { SmartImage } from '@/components/ui/SmartImage';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

interface Props {
  destinations: DestinationDTO[];
  locale: Locale;
}

/**
 * Yo'nalishlar gridi. Har bir kartochka alohida SEO landing sahifasiga
 * olib boradi ("Turkiyaga turlar", "Dubay turlari") — bu sahifalar
 * qidiruvdan trafik olib keladigan asosiy manba.
 */
export function DestinationsSection({ destinations, locale }: Props) {
  const t = useTranslations('tour');

  return (
    <RevealGroup className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      {destinations.map((destination) => {
        const name = pick(destination as unknown as Record<string, unknown>, 'name', locale);
        return (
          <RevealItem key={destination.id}>
            <Link
              href={{ pathname: '/yonalishlar/[slug]', params: { slug: destination.slug } }}
              className="group relative block h-full overflow-hidden rounded-card border border-line"
            >
              {/* Rasm ustidagi matn — har doim to'q fonda (pastdagi izohga qarang) */}
              <div
                data-tone="dark"
                className="relative aspect-[3/4] bg-navy-950 sm:aspect-square lg:aspect-[3/4]"
              >
                <SmartImage
                  media={destination.heroImage}
                  variant="poster"
                  alt={name}
                  locale={locale}
                  className="transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 23vw"
                />
                <div className="overlay-gradient absolute inset-0" />

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-lg font-bold text-ink sm:text-xl">{name}</h3>

                  <div className="mt-1 flex items-center justify-between gap-2">
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
                      className="size-4 shrink-0 text-accent transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
