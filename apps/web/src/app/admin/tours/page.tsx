'use client';

import { useMemo, useState } from 'react';
import { useAdminResource } from '@/hooks/useAdminResource';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Flame, Plus, Star, Trash2 } from 'lucide-react';
import type { ContentStatus, Paginated, TourDTO } from '@ayntravel/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  ContentStatusBadge,
  EmptyState,
  ErrorBox,
  inputStyles,
  Spinner,
  TableWrap,
  Td,
  Th,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/Button';
import { formatDate, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function AdminToursPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // So'rov manzili — o'zgarganda hook avtomatik qayta yuklaydi va
  // eskirgan javobni e'tiborsiz qoldiradi (poyga holati yo'q).
  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: '25' });
    if (statusFilter) params.set('status', statusFilter);
    if (query) params.set('search', query);
    return `/api/admin/tours?${params.toString()}`;
  }, [page, statusFilter, query]);

  const { data, loading, error, reload, setData } = useAdminResource<Paginated<TourDTO>>(path);

  /** Nashr holatini bir bosishda almashtiradi va saytni darhol yangilaydi. */
  async function togglePublish(tour: TourDTO) {
    const next: ContentStatus = tour.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setBusyId(tour.id);
    try {
      const updated = await adminClient.post<TourDTO>(`/api/admin/tours/${tour.id}/publish`, {
        status: next,
      });
      setData((prev) =>
        prev ? { ...prev, items: prev.items.map((t) => (t.id === tour.id ? updated : t)) } : prev,
      );
      toast.success(
        next === 'PUBLISHED' ? 'Tur nashr etildi' : 'Tur qoralamaga o‘tkazildi',
        next === 'PUBLISHED' ? 'Saytda darhol ko‘rinadi' : 'Saytdan olib tashlandi',
      );
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Saqlab bo‘lmadi');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(tour: TourDTO) {
    const ok = await confirm({
      title: `«${tour.titleUz}» turini o‘chirasizmi?`,
      description: 'Bu amalni qaytarib bo‘lmaydi. Turga bog‘langan arizalar saqlanib qoladi.',
      confirmLabel: 'O‘chirish',
      danger: true,
    });
    if (!ok) return;

    setBusyId(tour.id);
    try {
      await adminClient.delete(`/api/admin/tours/${tour.id}`);
      // Ro'yxatni qayta yuklamasdan darhol olib tashlaymiz — tezroq va tinchroq.
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((t) => t.id !== tour.id), total: prev.total - 1 }
          : prev,
      );
      toast.success('Tur o‘chirildi');
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'O‘chirib bo‘lmadi');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell
      title="Turlar"
      actions={
        <Button asChild size="sm">
          <Link href="/admin/tours/new">
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Yangi tur</span>
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search.trim());
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sarlavha yoki slug bo‘yicha qidirish"
            aria-label="Turlarni qidirish"
            className={cn(inputStyles, 'flex-1 sm:max-w-xs')}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Status bo‘yicha filtr"
            className={cn(inputStyles, 'sm:w-44')}
          >
            <option value="">Barcha statuslar</option>
            <option value="PUBLISHED">Nashr etilgan</option>
            <option value="DRAFT">Qoralama</option>
          </select>
          <Button type="submit" size="sm">
            Qidirish
          </Button>
        </form>

        {error && <ErrorBox message={error} onRetry={reload} />}

        {loading && !data ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Tur topilmadi"
            hint="“Yangi tur” tugmasi orqali birinchi turni qo‘shing."
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th className="w-16" />
                  <Th>Tur</Th>
                  <Th className="w-28">Narx</Th>
                  <Th className="w-32">Jo‘nash</Th>
                  <Th className="w-36">Status</Th>
                  <Th className="w-24">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((tour) => (
                  <tr key={tour.id} className={cn(busyId === tour.id && 'opacity-50')}>
                    <Td>
                      <div className="relative aspect-[4/5] w-11 overflow-hidden rounded border border-line bg-surface-raised">
                        {tour.posterImage && (
                          <Image
                            src={tour.posterImage.variants.thumb?.webp ?? tour.posterImage.url}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        )}
                      </div>
                    </Td>

                    <Td>
                      <Link
                        href={`/admin/tours/${tour.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {tour.titleUz}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                        {tour.destination && <span>{tour.destination.nameUz}</span>}
                        {tour.hotelStars && (
                          <span className="flex items-center gap-0.5">
                            {tour.hotelStars}
                            <Star className="size-3 fill-gold-300 text-accent" aria-hidden="true" />
                          </span>
                        )}
                        {tour.isHot && (
                          <span className="flex items-center gap-1 text-hot-400">
                            <Flame className="size-3" aria-hidden="true" />
                            Goryashiy
                          </span>
                        )}
                        {!tour.titleRu && (
                          <span className="text-amber-400">RU tarjima yo‘q</span>
                        )}
                      </div>
                    </Td>

                    <Td className="font-semibold whitespace-nowrap text-accent">
                      {formatPrice(tour.priceFrom, tour.currency)}
                    </Td>

                    <Td className="text-xs whitespace-nowrap text-ink-muted">
                      {tour.departureDate ? formatDate(tour.departureDate, 'uz', true) : '—'}
                    </Td>

                    <Td>
                      <button
                        type="button"
                        onClick={() => void togglePublish(tour)}
                        disabled={busyId === tour.id}
                        title="Bosib holatni almashtiring"
                        className="transition-opacity hover:opacity-75"
                      >
                        <ContentStatusBadge status={tour.status} />
                      </button>
                    </Td>

                    <Td>
                      <div className="flex gap-1">
                        {tour.status === 'PUBLISHED' && (
                          <a
                            href={`/uz/turlar/${tour.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Saytda ko‘rish"
                            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-accent"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => void remove(tour)}
                          aria-label="O‘chirish"
                          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-hot-500/10 hover:text-hot-400"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-subtle">
                  {data.page} / {data.totalPages} — jami {data.total} ta
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Oldingi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Keyingi
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
