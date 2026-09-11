'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Play, X } from 'lucide-react';
import type { Locale } from '@/shared';

export function TravelFilm({ locale }: { locale: Locale }) {
  const ru = locale === 'ru';
  const [failed, setFailed] = useState(false);
  return (
    <Dialog.Root onOpenChange={() => setFailed(false)}>
      <Dialog.Trigger className="group flex min-h-12 items-center gap-3 text-sm font-medium text-white">
        <span className="flex size-12 items-center justify-center rounded-full border border-white/40 transition-colors group-hover:bg-white/15"><Play className="size-4 fill-current" /></span>
        {ru ? 'Почувствуйте путешествие' : 'Sayohatni his qiling'}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-navy-950/90 backdrop-blur-md" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/20 bg-navy-950 p-2 shadow-2xl" data-tone="dark" aria-describedby="film-description">
          <div className="flex items-center justify-between gap-4 p-4">
            <Dialog.Title className="text-lg font-semibold">{ru ? 'Наедине с океаном' : 'Okean bilan yuzma-yuz'}</Dialog.Title>
            <Dialog.Close className="flex size-11 items-center justify-center rounded-full bg-white/10" aria-label={ru ? 'Закрыть видео' : 'Videoni yopish'}><X className="size-5" /></Dialog.Close>
          </div>
          <Dialog.Description id="film-description" className="sr-only">{ru ? 'Атмосферное видео океана без речи.' : 'Okean manzarasi aks etgan nutqsiz video.'}</Dialog.Description>
          {failed ? <p role="alert" className="p-10 text-center">{ru ? 'Видео не загрузилось. Попробуйте позже.' : 'Video yuklanmadi. Keyinroq qayta urinib ko‘ring.'}</p> : <video controls autoPlay muted playsInline preload="none" poster="/media/ocean.webp" className="aspect-video w-full rounded-xl bg-navy-900 object-cover" onError={() => setFailed(true)}><source src="/media/ocean.mp4" type="video/mp4" /></video>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
