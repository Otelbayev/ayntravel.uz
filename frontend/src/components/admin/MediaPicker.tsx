'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Check, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import type { MediaDTO, Paginated } from '@/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { Button } from '@/components/ui/Button';
import { useAdminResource } from '@/hooks/useAdminResource';
import { EmptyState, ErrorBox, Spinner } from './ui';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Bir nechta rasm tanlash (galereya uchun). */
  multiple?: boolean;
  onSelect: (media: MediaDTO[]) => void;
}

/**
 * Rasm kutubxonasi oynasi: mavjud rasmni tanlash yoki yangisini yuklash.
 *
 * Yuklangan rasm serverda darhol 4:5, 1:1 va 16:9 variantlarga kesiladi,
 * shuning uchun admin kesish bilan ovora bo'lmaydi — Instagram posterini
 * qanday bo'lsa shundayligicha yuklayveradi.
 */
export function MediaPicker({ open, onClose, multiple = false, onSelect }: Props) {
  // Oyna yopiq bo'lsa ichki komponent umuman mount bo'lmaydi — shu tufayli
  // har ochilganda tanlov va ro'yxat o'z-o'zidan tozalanadi va buning uchun
  // effekt ichida `setState` chaqirish kerak emas.
  if (!open) return null;

  return (
    <MediaPickerDialog
      onClose={onClose}
      multiple={multiple}
      onSelect={onSelect}
    />
  );
}

function MediaPickerDialog({
  onClose,
  multiple,
  onSelect,
}: {
  onClose: () => void;
  multiple: boolean;
  onSelect: (media: MediaDTO[]) => void;
}) {
  const {
    data,
    loading,
    error: loadError,
    reload,
    setData,
  } = useAdminResource<Paginated<MediaDTO>>('/api/admin/media?pageSize=60');

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = data?.items ?? [];
  const error = uploadError ?? loadError;

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (const file of Array.from(files).slice(0, 10)) formData.append('files', file);

    setUploading(true);
    setUploadError(null);
    try {
      const created = await adminClient.upload<MediaDTO[]>('/api/admin/media/upload', formData);
      // Yangi rasmlar ro'yxat boshiga qo'shiladi va darhol tanlanadi.
      setData((prev) => (prev ? { ...prev, items: [...created, ...prev.items] } : prev));
      setSelected(multiple ? created.map((m) => m.id) : [created[0]?.id ?? '']);
    } catch (err) {
      setUploadError(err instanceof AdminApiError ? err.message : 'Rasm yuklanmadi');
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
      aria-label="Rasm tanlash"
    >
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-line bg-surface">
        <div className="flex shrink-0 items-center justify-between border-b border-line p-5">
          <h2 className="font-display font-bold text-ink">Rasm tanlash</h2>
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
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
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
                Yangi rasm yuklash
              </>
            )}
          </Button>
          <p className="mt-2 text-xs text-ink-subtle">
            JPG, PNG, WebP yoki AVIF. Maksimal 12MB. Rasm avtomatik ravishda
            4:5, 1:1 va 16:9 formatlariga tayyorlanadi.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && <ErrorBox message={error} onRetry={reload} />}

          {loading && items.length === 0 ? (
            <Spinner />
          ) : items.length === 0 ? (
            <EmptyState title="Hali rasm yuklanmagan" hint="Yuqoridagi tugma orqali yuklang." />
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
                      'relative aspect-[4/5] overflow-hidden rounded-lg border-2 transition-colors',
                      isSelected
                        ? 'border-gold-500'
                        : 'border-transparent hover:border-ink/25',
                    )}
                  >
                    <Image
                      src={media.variants.thumb?.webp ?? media.url}
                      alt={media.altUz ?? ''}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
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

/** Formada tanlangan rasmni ko'rsatuvchi maydon. */
export function MediaField({
  media,
  onPick,
  onClear,
  label = 'Rasm',
  aspect = 'aspect-[4/5]',
}: {
  media: MediaDTO | null;
  onPick: () => void;
  onClear: () => void;
  label?: string;
  aspect?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-muted">{label}</span>

      {media ? (
        <div className={cn('relative w-40 overflow-hidden rounded-lg border border-line-strong', aspect)}>
          <Image
            src={media.variants.thumb?.webp ?? media.url}
            alt={media.altUz ?? ''}
            fill
            sizes="160px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            aria-label="Rasmni olib tashlash"
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
            'flex w-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-strong text-ink-subtle transition-colors hover:border-gold-500/50 hover:text-accent',
            aspect,
          )}
        >
          <ImagePlus className="size-6" aria-hidden="true" />
          <span className="text-xs">Rasm tanlash</span>
        </button>
      )}
    </div>
  );
}
