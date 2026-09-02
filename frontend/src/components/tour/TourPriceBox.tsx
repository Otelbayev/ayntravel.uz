'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, Phone } from 'lucide-react';
import type { TourDTO } from '@/shared';
import { formatPrice } from '@/lib/format';
import { LeadForm } from '@/components/forms/LeadForm';

interface Props {
  tour: TourDTO;
}

/**
 * Narx bloki va bron formasi.
 *
 * Desktop'da `sticky` — foydalanuvchi uzun dasturni o'qib pastga tushganda ham
 * narx va "Band qilish" tugmasi ko'z oldida qoladi. Bu konversiyaga eng
 * kuchli ta'sir qiladigan detal.
 *
 * Mobil'da oddiy blok bo'lib qoladi (sticky ekranni to'sib qo'ymasligi uchun) —
 * u yerda pastdagi suzuvchi qo'ng'iroq tugmasi shu vazifani bajaradi.
 */
export function TourPriceBox({ tour }: Props) {
  const t = useTranslations('tour');

  const lowSeats = tour.seatsLeft !== null && tour.seatsLeft > 0 && tour.seatsLeft <= 5;

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="card-surface gold-ring overflow-hidden">
        {/* Narx sarlavhasi — posterlardagi oltin blok uslubida */}
        <div className="border-b border-line bg-gradient-to-br from-navy-700 to-navy-900 p-6 text-center">
          <span className="block text-xs font-semibold tracking-widest text-accent uppercase">
            {t('from')}
          </span>

          <span className="text-gold-gradient font-display mt-1 block text-5xl leading-none font-black">
            {formatPrice(tour.priceFrom, tour.currency)}
          </span>

          <span className="mt-2 block text-sm text-ink/70">{t('perPerson')}</span>
          <span className="mt-0.5 block text-xs text-ink/50">{t('doubleOccupancy')}</span>

          {tour.extraFee !== null && tour.extraFee > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/8 px-3 py-2">
              <AlertCircle className="size-4 text-accent" aria-hidden="true" />
              <span className="text-sm text-ink">
                {t('extraFee')}:{' '}
                <strong className="text-accent">
                  {formatPrice(tour.extraFee, tour.currency)}
                </strong>
              </span>
            </div>
          )}

          {lowSeats && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold text-hot-400">
              <span className="inline-block size-2 animate-pulse rounded-full bg-hot-400" />
              {t('seatsLeft', { count: tour.seatsLeft! })}
            </p>
          )}
        </div>

        <div className="p-6">
          <LeadForm
            source="tour_page"
            tourId={tour.id}
            withMessage={false}
            compact
            className="gap-3"
          />
        </div>
      </div>

      {/* Mobil'da forma pastda qolgani uchun bu yerda tez qo'ng'iroq havolasi */}
      <a
        href="tel:+998915443160"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-line-strong px-4 py-3 font-semibold text-ink transition-colors hover:border-gold-500/50 hover:text-accent lg:hidden"
      >
        <Phone className="size-4" aria-hidden="true" />
        +998 91 544 31 60
      </a>
    </aside>
  );
}
