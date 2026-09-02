'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import type { DestinationDTO, Locale } from '@/shared';
import { pick } from '@/shared';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Props {
  destinations: DestinationDTO[];
  locale: Locale;
}

const selectStyles =
  'h-11 w-full rounded-xl border border-line-strong bg-surface-raised px-3 text-sm text-ink focus:border-gold-500/60 focus:outline-none';

/**
 * Turlar filtri.
 *
 * Holat URL'da saqlanadi (`?destination=turkiya&sort=price_asc`) — shunda
 * filtrlangan natijani havola sifatida ulashish mumkin, orqaga tugmasi
 * to'g'ri ishlaydi va sahifa server tomonda render bo'laveradi.
 */
export function TourFilters({ destinations, locale }: Props) {
  const t = useTranslations('filters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const current = (key: string) => searchParams.get(key) ?? '';

  function apply(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // Filtr o'zgarsa har doim birinchi sahifaga qaytamiz.
    next.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${next.toString()}` as never);
    });
  }

  function reset() {
    startTransition(() => {
      router.push(pathname as never);
    });
  }

  const activeCount = ['destination', 'minPrice', 'maxPrice', 'nights', 'stars', 'hot', 'search']
    .filter((key) => searchParams.get(key))
    .length;

  return (
    <div className={cn('card-surface p-4 sm:p-5', isPending && 'opacity-60')}>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 font-semibold text-ink"
          aria-expanded={open}
        >
          <SlidersHorizontal className="size-4 text-accent" aria-hidden="true" />
          {t('title')}
          {activeCount > 0 && (
            <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-navy-950">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 text-sm text-ink-muted hover:text-accent"
          >
            <X className="size-3.5" aria-hidden="true" />
            {t('reset')}
          </button>
        )}
      </div>

      <div className={cn('mt-4 grid gap-3 lg:mt-0 lg:grid-cols-5', !open && 'hidden lg:grid')}>
        <div>
          <label htmlFor="f-destination" className="mb-1.5 block text-xs text-ink-subtle">
            {t('destination')}
          </label>
          <select
            id="f-destination"
            className={selectStyles}
            value={current('destination')}
            onChange={(e) => apply('destination', e.target.value)}
          >
            <option value="">{t('allDestinations')}</option>
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.slug}>
                {pick(destination as unknown as Record<string, unknown>, 'name', locale)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-min" className="mb-1.5 block text-xs text-ink-subtle">
            {t('price')} ({t('priceFrom')})
          </label>
          <input
            id="f-min"
            type="number"
            min={0}
            step={50}
            inputMode="numeric"
            placeholder="0"
            className={selectStyles}
            defaultValue={current('minPrice')}
            onBlur={(e) => apply('minPrice', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="f-max" className="mb-1.5 block text-xs text-ink-subtle">
            {t('price')} ({t('priceTo')})
          </label>
          <input
            id="f-max"
            type="number"
            min={0}
            step={50}
            inputMode="numeric"
            placeholder="3000"
            className={selectStyles}
            defaultValue={current('maxPrice')}
            onBlur={(e) => apply('maxPrice', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="f-stars" className="mb-1.5 block text-xs text-ink-subtle">
            {t('stars')}
          </label>
          <select
            id="f-stars"
            className={selectStyles}
            value={current('stars')}
            onChange={(e) => apply('stars', e.target.value)}
          >
            <option value="">{t('anyStars')}</option>
            {[3, 4, 5].map((star) => (
              <option key={star} value={star}>
                {star}★+
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-sort" className="mb-1.5 block text-xs text-ink-subtle">
            {t('sort')}
          </label>
          <select
            id="f-sort"
            className={selectStyles}
            value={current('sort') || 'date_asc'}
            onChange={(e) => apply('sort', e.target.value)}
          >
            <option value="date_asc">{t('sortDateAsc')}</option>
            <option value="price_asc">{t('sortPriceAsc')}</option>
            <option value="price_desc">{t('sortPriceDesc')}</option>
            <option value="newest">{t('sortNewest')}</option>
            <option value="popular">{t('sortPopular')}</option>
          </select>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="mt-4 hidden justify-end lg:flex">
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="size-3.5" aria-hidden="true" />
            {t('reset')}
          </Button>
        </div>
      )}
    </div>
  );
}
