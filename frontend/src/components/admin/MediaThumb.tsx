'use client';

import Image from 'next/image';
import { Film } from 'lucide-react';
import type { MediaDTO } from '@/shared';
import { cn } from '@/lib/utils';

/** Soniyani `m:ss` ga o'giradi — video bejida ko'rsatiladi. */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Media kutubxonasidagi bitta element ko'rinishi — rasm ham, video ham.
 *
 * NIMA UCHUN ALOHIDA KOMPONENT: video qatorlarida `variants` bo'sh, ya'ni
 * `next/image` ga berish uchun URL yo'q. Bu komponentsiz media ro'yxati
 * birinchi video paydo bo'lganda qulaydi.
 */
export function MediaThumb({
  media,
  sizes = '150px',
  className,
}: {
  media: MediaDTO;
  sizes?: string;
  className?: string;
}) {
  if (media.kind === 'VIDEO') {
    return (
      <div className={cn('relative size-full bg-navy-950', className)}>
        {media.sourceUrl ? (
          // `#t=0.1` — Firefox'ni birinchi kadrni chizishga majbur qiladi;
          // Chrome va Safari `preload="metadata"` ning o'ziyoq chizadi.
          <video
            src={`${media.sourceUrl}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            tabIndex={-1}
            className="size-full object-cover"
          />
        ) : (
          <Placeholder />
        )}

        <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-navy-950/85 px-1.5 py-0.5 text-[10px] font-bold text-gold-300">
          <Film className="size-3" aria-hidden="true" />
          {media.durationSeconds ? formatDuration(media.durationSeconds) : 'VIDEO'}
        </span>
      </div>
    );
  }

  const src = media.variants.thumb?.webp ?? media.url;
  if (!src) return <Placeholder className={className} />;

  return (
    <Image
      src={src}
      alt={media.altUz ?? ''}
      fill
      sizes={sizes}
      className={cn('object-cover', className)}
    />
  );
}

function Placeholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center bg-navy-950 font-display text-xs font-bold tracking-widest text-white/20',
        className,
      )}
    >
      AYN
    </div>
  );
}
