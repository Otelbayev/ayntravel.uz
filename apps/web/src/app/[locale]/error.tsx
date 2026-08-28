'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error');

  useEffect(() => {
    // Production'da bu yerdan Sentry kabi xizmatga yuborish mumkin.
    console.error('Sahifa xatosi:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 pt-24 text-center">
      <AlertTriangle className="size-14 text-hot-400" aria-hidden="true" />
      <h1 className="text-2xl sm:text-3xl">{t('errorTitle')}</h1>
      <p className="max-w-md text-ink-muted">{t('errorText')}</p>
      <Button size="lg" onClick={reset} className="mt-2">
        {t('retry')}
      </Button>
    </div>
  );
}
