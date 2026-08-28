import Image from 'next/image';
import type { ImageVariantName, Locale, MediaDTO } from '@ayntravel/shared';
import { cn } from '@/lib/utils';

interface SmartImageProps {
  media: MediaDTO | null | undefined;
  /** Qaysi nisbat kerakligi: poster (4:5), square, wide (16:9), thumb. */
  variant?: ImageVariantName;
  alt?: string;
  locale?: Locale;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}

/**
 * `Media` yozuvidan to'g'ri variantni tanlab, `next/image` bilan chizadi.
 *
 * Uchta narsani birdan hal qiladi:
 *  • kerakli nisbat (tur kartochkasi doim 4:5 — Instagram formati)
 *  • blur placeholder (`blurDataUrl` bazada saqlangan) — CLS 0 bo'ladi
 *  • alt matni joriy tilda, bo'lmasa boshqa tildan
 */
export function SmartImage({
  media,
  variant = 'poster',
  alt,
  locale = 'uz',
  className,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  fill = true,
  width,
  height,
}: SmartImageProps) {
  const src =
    media?.variants[variant]?.webp ??
    media?.variants.poster?.webp ??
    media?.url ??
    null;

  const altText =
    alt ?? (locale === 'ru' ? media?.altRu : media?.altUz) ?? media?.altUz ?? '';

  if (!src) {
    // Rasm hali yuklanmagan — bo'sh joy o'rniga brend fonini ko'rsatamiz,
    // shunda karta "singan" ko'rinmaydi.
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-950',
          fill && 'absolute inset-0',
          className,
        )}
        aria-hidden="true"
      >
        <span className="font-display text-2xl font-black tracking-widest text-ink/10">
          AYN
        </span>
      </div>
    );
  }

  const blur = media?.blurDataUrl
    ? { placeholder: 'blur' as const, blurDataURL: media.blurDataUrl }
    : {};

  if (fill) {
    return (
      <Image
        src={src}
        alt={altText}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
        {...blur}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={altText}
      width={width ?? 1080}
      height={height ?? 1350}
      sizes={sizes}
      priority={priority}
      className={className}
      {...blur}
    />
  );
}
