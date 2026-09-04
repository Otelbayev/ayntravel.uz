'use client';

import { useRef, useState } from 'react';
import { Check, FilePlus2, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import type { MediaDTO, Paginated } from '@/shared';
import { AdminApiError } from '@/lib/admin-client';
import { uploadImages, uploadVideo } from '@/lib/media-upload';
import { Button } from '@/components/ui/Button';
import { useAdminResource } from '@/hooks/useAdminResource';
import { EmptyState, ErrorBox, Spinner } from './ui';
import { MediaThumb } from './MediaThumb';
import { cn } from '@/lib/utils';

type PickerKind = 'image' | 'video';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Bir nechta rasm tanlash (galereya uchun). Videoda e'tiborsiz qoldiriladi. */
  multiple?: boolean;
  /** Default `'image'` — mavjud chaqiruvlar o'zgarmasligi uchun. */
  kind?: PickerKind;
  onSelect: (media: MediaDTO[]) => void;
}

/** Har bir tur uchun oynadagi matnlar va fayl filtri. */
const KIND_UI: Record<PickerKind, { title: string; accept: string; upload: string; hint: string; empty: string }> = {
  image: {
    title: 'Rasm tanlash',
    accept: 'image/jpeg,image/png,image/webp,image/avif',
    upload: 'Yangi rasm yuklash',
    hint: 'JPG, PNG, WebP yoki AVIF. Maksimal 12MB. Rasm avtomatik ravishda 4:5, 1:1 va 16:9 formatlariga tayyorlanadi.',
    empty: 'Hali rasm yuklanmagan',
  },
  video: {
    title: 'Video tanlash',
    accept: 'video/mp4,video/webm',
    upload: 'Yangi video yuklash',
    hint: 'MP4 yoki WebM. Maksimal 48MB. 8–15 soniyalik, tovushsiz loop tavsiya etiladi — hero fonida u aylanib turadi.',
    empty: 'Hali video yuklanmagan',
  },
};

/**
 * Video o'lchamlari va davomiyligini brauzerda o'lchaydi.
 *
 * Serverda ffmpeg yo'q va qo'shilmaydi, shuning uchun metama'lumotni yagona
 * olish yo'li — yuklashdan oldin faylni `<video>` ga berib ko'rish.
 */
async function probeVideo(file: File): Promise<{ width: number; height: number; duration: number }> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve) => {
      const el = document.createElement('video');
      el.preload = 'metadata';
      el.muted = true;

      const done = (result: { width: number; height: number; duration: number }) => {
        clearTimeout(timer);
        resolve(result);
      };
      // Fayl buzilgan bo'lsa `loadedmetadata` hech qachon kelmaydi —
      // yuklashni butunlay to'xtatib qo'ymasligi uchun taymer.
      const timer = setTimeout(() => done({ width: 0, height: 0, duration: 0 }), 5000);

      el.onloadedmetadata = () =>
        done({
          width: el.videoWidth,
          height: el.videoHeight,
          duration: Number.isFinite(el.duration) ? el.duration : 0,
        });
      el.onerror = () => done({ width: 0, height: 0, duration: 0 });
      el.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Media kutubxonasi oynasi: mavjud faylni tanlash yoki yangisini yuklash.
 *
 * Yuklangan rasm serverda darhol 4:5, 1:1 va 16:9 variantlarga kesiladi,
 * shuning uchun admin kesish bilan ovora bo'lmaydi — Instagram posterini
 * qanday bo'lsa shundayligicha yuklayveradi. Video esa xom saqlanadi.
 */
export function MediaPicker({ open, onClose, multiple = false, kind = 'image', onSelect }: Props) {
  // Oyna yopiq bo'lsa ichki komponent umuman mount bo'lmaydi — shu tufayli
  // har ochilganda tanlov va ro'yxat o'z-o'zidan tozalanadi va buning uchun
  // effekt ichida `setState` chaqirish kerak emas.
  if (!open) return null;

  return (
    <MediaPickerDialog
      onClose={onClose}
      multiple={kind === 'video' ? false : multiple}
      kind={kind}
      onSelect={onSelect}
    />
  );
}

function MediaPickerDialog({
  onClose,
  multiple,
  kind,
  onSelect,
}: {
  onClose: () => void;
  multiple: boolean;
  kind: PickerKind;
  onSelect: (media: MediaDTO[]) => void;
}) {
  const ui = KIND_UI[kind];
  const {
    data,
    loading,
    error: loadError,
    reload,
    setData,
  } = useAdminResource<Paginated<MediaDTO>>(
    `/api/admin/media?pageSize=60&kind=${kind === 'video' ? 'VIDEO' : 'IMAGE'}`,
  );

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = data?.items ?? [];
  const error = uploadError ?? loadError;

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    try {
      let created: MediaDTO[];

      if (kind === 'video') {
        const file = files[0]!;
        created = await uploadVideo(file, await probeVideo(file));
      } else {
        created = await uploadImages(Array.from(files));
      }

      // Yangi fayllar ro'yxat boshiga qo'shiladi va darhol tanlanadi.
      setData((prev) => (prev ? { ...prev, items: [...created, ...prev.items] } : prev));
      setSelected(multiple ? created.map((m) => m.id) : [created[0]?.id ?? '']);
    } catch (err) {
      setUploadError(
        err instanceof AdminApiError
          ? err.message
          : kind === 'video'
            ? 'Video yuklanmadi'
            : 'Rasm yuklanmadi',
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function toggle(id: string) {
    setSelected((prev) =>
      multiple
        ? prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id]
        : [id],
    );
  }

  function confirm() {
    const chosen = selected
      .map((id) => items.find((m) => m.id === id))
      .filter((m): m is MediaDTO => Boolean(m));
    onSelect(chosen);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={ui.title}
    >
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-line bg-surface">
        <div className="flex shrink-0 items-center justify-between border-b border-line p-5">
          <h2 className="font-display font-bold text-ink">{ui.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="rounded-lg p-1.5 text-ink-muted hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-line p-5">
          <input
            ref={inputRef}
            type="file"
            accept={ui.accept}
            multiple={kind === 'image'}
            className="hidden"
            onChange={(e) => void upload(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <Upload className="size-4" aria-hidden="true" />
                {ui.upload}
              </>
            )}
          </Button>
          <p className="mt-2 text-xs text-ink-subtle">{ui.hint}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && <ErrorBox message={error} onRetry={reload} />}

          {loading && items.length === 0 ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState title={ui.empty} hint="Yuqoridagi tugma orqali yuklang." />
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((media) => {
                const isSelected = selected.includes(media.id);
                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => toggle(media.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'relative overflow-hidden rounded-lg border-2 transition-colors',
                      kind === 'video' ? 'aspect-video' : 'aspect-[4/5]',
                      isSelected
                        ? 'border-gold-500'
                        : 'border-transparent hover:border-ink/25',
                    )}
                  >
                    <MediaThumb media={media} sizes="150px" />
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-gold-500 text-navy-950">
                        <Check className="size-4" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line p-5">
          <span className="text-sm text-ink-subtle">
            {selected.length > 0 ? `${selected.length} ta tanlandi` : 'Rasm tanlanmagan'}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button type="button" onClick={confirm} disabled={selected.length === 0}>
              Tanlash
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Formada tanlangan media faylni ko'rsatuvchi maydon. */
export function MediaField({
  media,
  onPick,
  onClear,
  label = 'Rasm',
  aspect = 'aspect-[4/5]',
  kind = 'image',
  width = 'w-40',
}: {
  media: MediaDTO | null;
  onPick: () => void;
  onClear: () => void;
  label?: string;
  aspect?: string;
  kind?: PickerKind;
  width?: string;
}) {
  const isVideo = kind === 'video';
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-muted">{label}</span>

      {media ? (
        <div
          className={cn(
            'relative overflow-hidden rounded-lg border border-line-strong',
            width,
            aspect,
          )}
        >
          <MediaThumb media={media} sizes="200px" />
          <button
            type="button"
            onClick={onClear}
            aria-label={isVideo ? 'Videoni olib tashlash' : 'Rasmni olib tashlash'}
            className="absolute top-1.5 right-1.5 rounded-full bg-navy-950/80 p-1.5 text-white hover:bg-hot-500"
          >
            <X className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onPick}
            className="absolute inset-x-0 bottom-0 bg-navy-950/80 py-1.5 text-xs font-semibold text-white hover:bg-navy-950"
          >
            O‘zgartirish
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-strong text-ink-subtle transition-colors hover:border-gold-500/50 hover:text-accent',
            width,
            aspect,
          )}
        >
          {isVideo ? (
            <FilePlus2 className="size-6" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-6" aria-hidden="true" />
          )}
          <span className="text-xs">{isVideo ? 'Video tanlash' : 'Rasm tanlash'}</span>
        </button>
      )}
    </div>
  );
}
