'use client';

import { useRef, useState } from 'react';
import { useAdminResource } from '@/hooks/useAdminResource';
import Link from 'next/link';
import { Loader2, Trash2, Upload } from 'lucide-react';
import type { MediaDTO, Paginated } from '@/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { uploadImages } from '@/lib/media-upload';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaThumb } from '@/components/admin/MediaThumb';
import { EmptyState, ErrorBox, inputStyles, Spinner } from '@/components/admin/ui';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Rasmlar kutubxonasi.
 *
 * Alt matni SEO va skrinriderlar uchun muhim, shuning uchun uni shu yerda
 * tahrirlash mumkin — rasm qayerda ishlatilishidan qat'i nazar bir joyda turadi.
 */
export default function MediaPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload, setData } =
    useAdminResource<Paginated<MediaDTO>>('/api/admin/media?pageSize=60');

  const [uploading, setUploading] = useState(false);
  const [savingAlt, setSavingAlt] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = data?.items ?? [];

  /** Ro'yxatni serverdan qayta so'ramasdan yangilaydi. */
  function updateItems(fn: (prev: MediaDTO[]) => MediaDTO[]) {
    setData((prev) => (prev ? { ...prev, items: fn(prev.items) } : prev));
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    try {
      const created = await uploadImages(Array.from(files));
      updateItems((prev) => [...created, ...prev]);
      toast.success(
        created.length === 1 ? 'Rasm yuklandi' : `${created.length} ta rasm yuklandi`,
        'Har biri 4:5, 1:1 va 16:9 formatlariga tayyorlandi',
      );
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Yuklab bo‘lmadi');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function saveAlt(media: MediaDTO, altUz: string) {
    if (altUz === (media.altUz ?? '')) return;
    setSavingAlt(media.id);
    try {
      const updated = await adminClient.patch<MediaDTO>(`/api/admin/media/${media.id}`, { altUz });
      updateItems((prev) => prev.map((m) => (m.id === media.id ? updated : m)));
      toast.success('Alt matn saqlandi');
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Saqlab bo‘lmadi');
    } finally {
      setSavingAlt(null);
    }
  }

  async function remove(media: MediaDTO) {
    const ok = await confirm({
      title: 'Rasmni o‘chirasizmi?',
      description: 'Rasm va uning barcha formatlari serverdan butunlay o‘chadi.',
      confirmLabel: 'O‘chirish',
      danger: true,
    });
    if (!ok) return;

    try {
      await adminClient.delete(`/api/admin/media/${media.id}`);
      updateItems((prev) => prev.filter((m) => m.id !== media.id));
      toast.success('Rasm o‘chirildi');
    } catch (err) {
      // Server ishlatilayotgan rasmni o'chirishga yo'l qo'ymaydi —
      // xabar aynan qayerda ishlatilayotganini aytadi.
      toast.error(err instanceof AdminApiError ? err.message : 'O‘chirib bo‘lmadi');
    }
  }

  return (
    <AdminShell
      title="Rasmlar"
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => void upload(e.target.files)}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Yuklash</span>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorBox message={error} onRetry={reload} />}

        {loading && items.length === 0 ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            title="Hali rasm yuklanmagan"
            hint="Instagram posterlaringizni shu yerga yuklang — ular avtomatik 4:5, 1:1 va 16:9 formatlariga tayyorlanadi."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((media) => (
              <div
                key={media.id}
                className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3"
              >
                <div
                  className={cn(
                    'relative overflow-hidden rounded-lg bg-surface-raised',
                    media.kind === 'VIDEO' ? 'aspect-video' : 'aspect-[4/5]',
                  )}
                >
                  {/* Fayl ustiga bosilsa to'liq kartochka ochiladi */}
                  <Link
                    href={`/admin/media/${media.id}`}
                    aria-label="Faylni ochish"
                    className="absolute inset-0"
                  >
                    <MediaThumb
                      media={media}
                      sizes="(max-width: 640px) 46vw, 22vw"
                      className="transition-transform hover:scale-105"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void remove(media)}
                    aria-label="O‘chirish"
                    className="absolute top-2 right-2 rounded-full bg-navy-950/80 p-1.5 text-white transition-colors hover:bg-hot-500"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <input
                  defaultValue={media.altUz ?? ''}
                  onBlur={(e) => void saveAlt(media, e.target.value.trim())}
                  placeholder="Alt matn (SEO uchun)"
                  aria-label="Rasm alt matni"
                  disabled={savingAlt === media.id}
                  className={`${inputStyles} py-1.5 text-xs`}
                />

                <p className="text-[11px] text-ink-subtle">
                  {media.width}×{media.height}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
