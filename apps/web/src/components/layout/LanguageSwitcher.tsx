'use client';

import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const LABELS = { uz: "O'zbekcha", ru: 'Русский' } as const;
const SHORT = { uz: 'UZ', ru: 'RU' } as const;

/**
 * Tilni almashtiradi va foydalanuvchini AYNAN shu sahifada qoldiradi.
 * `usePathname` next-intl'dan olinadi — u lokalizatsiyalangan marshrutni
 * (/uz/turlar ↔ /ru/tury) to'g'ri o'giradi.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as 'uz' | 'ru';
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const other = locale === 'uz' ? 'ru' : 'uz';

  function switchTo(next: 'uz' | 'ru') {
    startTransition(() => {
      // `params` — [slug] kabi dinamik segmentlar uchun.
      router.replace(
        // @ts-expect-error — pathname va params juftligini TS statik tekshira olmaydi
        { pathname, params },
        { locale: next },
      );
    });
  }

  return (
    <button
      type="button"
      onClick={() => switchTo(other)}
      disabled={isPending}
      aria-label={`${LABELS[other]}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1.5',
        'text-xs font-bold text-ink/80 transition-colors hover:border-gold-500/50 hover:text-accent',
        isPending && 'opacity-50',
        className,
      )}
    >
      <Globe className="size-3.5" aria-hidden="true" />
      {SHORT[locale]}
    </button>
  );
}
