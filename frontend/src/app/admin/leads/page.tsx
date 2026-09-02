'use client';

import { Suspense, useMemo, useState } from 'react';
import { useAdminResource } from '@/hooks/useAdminResource';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Eye, Phone, Search, Send, Trash2 } from 'lucide-react';
import {
  formatUzPhone,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadDTO,
  type LeadStatus,
  type Paginated,
} from '@/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  EmptyState,
  ErrorBox,
  inputStyles,
  LeadStatusBadge,
  Spinner,
  TableWrap,
  Td,
  Th,
} from '@/components/admin/ui';
import { Button } from '@/components/ui/Button';
import { formatDateTime, sourceLabel, telegramLink } from '@/lib/leads';
import { cn } from '@/lib/utils';

type LeadsResponse = Paginated<LeadDTO> & { counts: Record<string, number> };

function LeadsTable() {
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const status = searchParams.get('status') ?? '';
  const page = searchParams.get('page') ?? '1';
  const searchQuery = searchParams.get('search') ?? '';

  // Filtr URL'da saqlanadi; manzil o'zgarishi bilan hook qayta yuklaydi.
  const path = useMemo(() => {
    const params = new URLSearchParams({ page, pageSize: '25' });
    if (status) params.set('status', status);
    if (searchQuery) params.set('search', searchQuery);
    return `/api/admin/leads?${params.toString()}`;
  }, [page, status, searchQuery]);

  const { data, loading, error, reload, setData } = useAdminResource<LeadsResponse>(path);

  /** Filtr holati URL'da — sahifani yangilagach ham saqlanadi va ulashish mumkin. */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    router.push(`/admin/leads?${next.toString()}`);
  }

  async function updateStatus(lead: LeadDTO, newStatus: LeadStatus) {
    setSavingId(lead.id);
    try {
      const updated = await adminClient.patch<LeadDTO>(`/api/admin/leads/${lead.id}`, {
        status: newStatus,
      });
      // Ro'yxatni to'liq qayta yuklamasdan faqat shu qatorni yangilaymiz.
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.map((l) => (l.id === lead.id ? updated : l)) }
          : prev,
      );
      toast.success(
        `${lead.name} — ${LEAD_STATUS_LABELS[newStatus].uz}`,
        newStatus === 'BOOKED' ? 'Menejerlar guruhiga xabar yuborildi' : undefined,
      );
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Statusni saqlab bo‘lmadi');
    } finally {
      setSavingId(null);
    }
  }

  async function remove(lead: LeadDTO) {
    const ok = await confirm({
      title: `${lead.name} arizasini o‘chirasizmi?`,
      description:
        'Ariza butunlay o‘chadi. Agar mijoz mos kelmagan bo‘lsa, o‘chirish o‘rniga «Spam» yoki «Yo‘qotildi» statusini qo‘ying — statistika saqlanib qoladi.',
      confirmLabel: 'O‘chirish',
      danger: true,
    });
    if (!ok) return;

    try {
      await adminClient.delete(`/api/admin/leads/${lead.id}`);
      setData((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((l) => l.id !== lead.id), total: prev.total - 1 }
          : prev,
      );
      toast.success('Ariza o‘chirildi');
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'O‘chirib bo‘lmadi');
    }
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (searchQuery) params.set('search', searchQuery);
    void adminClient
      .download(
        `/api/admin/leads/export?${params.toString()}`,
        `ayn-travel-lidlar-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      .then(() => toast.success('Fayl yuklandi', 'Excel’da ochish mumkin'))
      .catch(() => toast.error('Faylni yuklab bo‘lmadi'));
  }

  return (
    <AdminShell
      title="Arizalar"
      actions={
        <Button size="sm" variant="outline" onClick={exportCsv}>
          <Download className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Excel’ga yuklash</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Status bo'yicha tez filtr */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setParam('status', '')}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              !status
                ? 'border-gold-500 bg-gold-500 text-navy-950'
                : 'border-line-strong text-ink-muted hover:text-ink',
            )}
          >
            Barchasi {data ? `(${data.total})` : ''}
          </button>

          {LEAD_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setParam('status', s)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                status === s
                  ? 'border-gold-500 bg-gold-500 text-navy-950'
                  : 'border-line-strong text-ink-muted hover:text-ink',
              )}
            >
              {LEAD_STATUS_LABELS[s].uz}
              {data?.counts[s] ? ` (${data.counts[s]})` : ''}
            </button>
          ))}
        </div>

        {/* Qidiruv */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('search', search.trim());
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism yoki telefon raqami bo‘yicha qidirish"
              aria-label="Arizalarni qidirish"
              className={cn(inputStyles, 'pl-9')}
            />
          </div>
          <Button type="submit" size="sm">
            Qidirish
          </Button>
        </form>

        {error && <ErrorBox message={error} onRetry={reload} />}

        {loading && !data ? (
          <Spinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Ariza topilmadi"
            hint="Filtrni o‘zgartiring yoki yangi arizalarni kuting."
          />
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th className="w-36">Sana</Th>
                  <Th>Mijoz</Th>
                  <Th>Tur / manba</Th>
                  <Th className="w-44">Status</Th>
                  <Th className="w-28">Amallar</Th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((lead) => (
                  <tr key={lead.id} className={cn(savingId === lead.id && 'opacity-50')}>
                    <Td className="text-xs whitespace-nowrap text-ink-muted">
                      {formatDateTime(lead.createdAt)}
                    </Td>

                    <Td>
                      {/* Ism — arizaning to'liq kartochkasiga havola */}
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-ink hover:text-accent hover:underline"
                      >
                        {lead.name}
                      </Link>
                      <a
                        href={`tel:${lead.phone}`}
                        className="block text-xs text-accent hover:underline"
                      >
                        {formatUzPhone(lead.phone)}
                      </a>
                      {lead.message && (
                        <p className="mt-1 max-w-xs text-xs text-ink-subtle">{lead.message}</p>
                      )}
                    </Td>

                    <Td>
                      {lead.tour ? (
                        <p className="text-sm">{lead.tour.titleUz}</p>
                      ) : (
                        <span className="text-xs text-ink-subtle">—</span>
                      )}
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        {sourceLabel(lead.source)}
                        {lead.utm?.source ? ` · ${lead.utm.source}` : ''}
                      </p>
                    </Td>

                    <Td>
                      <select
                        value={lead.status}
                        onChange={(e) => void updateStatus(lead, e.target.value as LeadStatus)}
                        disabled={savingId === lead.id}
                        aria-label={`${lead.name} arizasi statusi`}
                        className={cn(inputStyles, 'py-1.5 text-xs')}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {LEAD_STATUS_LABELS[s].uz}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1.5">
                        <LeadStatusBadge status={lead.status} />
                      </div>
                    </Td>

                    <Td>
                      <div className="flex gap-1">
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          aria-label="Arizani ochish"
                          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-accent"
                        >
                          <Eye className="size-4" />
                        </Link>
                        <a
                          href={`tel:${lead.phone}`}
                          aria-label="Qo‘ng‘iroq qilish"
                          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-accent"
                        >
                          <Phone className="size-4" />
                        </a>
                        <a
                          href={telegramLink(lead.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Telegram’da yozish"
                          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-ink/5 hover:text-sky-300"
                        >
                          <Send className="size-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void remove(lead)}
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
                    onClick={() => setParam('page', String(data.page - 1))}
                  >
                    Oldingi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page >= data.totalPages}
                    onClick={() => setParam('page', String(data.page + 1))}
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

export default function LeadsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LeadsTable />
    </Suspense>
  );
}
