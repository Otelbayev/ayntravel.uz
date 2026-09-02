import { useTranslations } from 'next-intl';
import { Compass } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const t = useTranslations('error');
  const tCommon = useTranslations('common');

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 pt-24 text-center">
      <Compass className="size-16 text-accent/40" aria-hidden="true" />
      <p className="text-gold-gradient font-display text-6xl font-black">404</p>
      <h1 className="text-2xl sm:text-3xl">{t('notFoundTitle')}</h1>
      <p className="max-w-md text-ink-muted">{t('notFoundText')}</p>
      <Button asChild size="lg" className="mt-2">
        <Link href="/">{tCommon('backHome')}</Link>
      </Button>
    </div>
  );
}
