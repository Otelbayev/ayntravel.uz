'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  totalPages: number;
  className?: string;
}

/** Sahifa raqami URL'da saqlanadi — orqaga tugmasi va ulashish to'g'ri ishlaydi. */
export function Pagination({ page, totalPages, className }: Props) {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(target: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (target <= 1) next.delete('page');
    else next.set('page', String(target));
    const qs = next.toString();
    router.push((qs ? `${pathname}?${qs}` : pathname) as never);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Joriy sahifa atrofidagi raqamlarni ko'rsatamiz, qolganini "…" bilan siqamiz.
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <nav className={cn('flex items-center justify-center gap-2', className)} aria-label={t('page')}>
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        aria-label={t('prev')}
        className="flex size-10 items-center justify-center rounded-lg border border-line-strong text-ink transition-colors hover:border-gold-500/50 hover:text-accent disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((item, index) =>
        item === '…' ? (
          <span key={`gap-${index}`} className="px-1 text-ink-subtle">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goTo(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              'flex size-10 items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
              item === page
                ? 'border-gold-500 bg-gold-500 text-navy-950'
                : 'border-line-strong text-ink hover:border-gold-500/50 hover:text-accent',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        aria-label={t('next')}
        className="flex size-10 items-center justify-center rounded-lg border border-line-strong text-ink transition-colors hover:border-gold-500/50 hover:text-accent disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
