'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import {
  formatUzPhone,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadDTO,
  type LeadStatus,
} from '@/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { useAdminResource } from '@/hooks/useAdminResource';
import { formatDateTime, sourceLabel, telegramLink, timeAgo, utmRows } from '@/lib/leads';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, ErrorBox, Field, FormSkeleton, inputStyles, LeadStatusBadge } from '@/components/admin/ui';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Bitta arizaning to'liq kartochkasi.
 *
 * Telegram xabaridagi «Admin panelda ochish» havolasi aynan shu manzilga
 * yuboradi (`backend/src/services/telegram.ts`). Menejer telefonda gaplashib
 * turib shu sahifani ochadi: bir bosishda qo'ng'iroq qiladi, statusni
 * o'zgartiradi va izoh yozadi.
 */
export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  const { data: lead, loading, error, reload, setData } = useAdminResource<LeadDTO>(
    `/api/admin/leads/${id}`,
  );

  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Izoh maydoni serverdan kelgan qiymatdan boshlanadi, keyin menejer tahrirlaydi.
  const noteValue = note ?? lead?.managerNote ?? '';
  const noteChanged = lead !== null && noteValue !== (lead?.managerNote ?? '');

  async function changeStatus(status: LeadStatus) {
    if (!lead || lead.status === status) return;
    setSaving(true);
    try {
      const updated = await adminClient.patch<LeadDTO>(`/api/admin/leads/${lead.id}`, { status });
      setData(() => updated);
      toast.success(
        LEAD_STATUS_LABELS[status].uz,
        status === 'BOOKED' ? 'Menejerlar guruhiga xabar yuborildi' : undefined,
      );
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Saqlab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    if (!lead) return;
    setSaving(true);
    try {
      const updated = await adminClient.patch<LeadDTO>(`/api/admin/leads/${lead.id}`, {
        managerNote: noteValue,
      });
      setData(() => updated);
      setNote(null);
      toast.success('Izoh saqlandi');
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Saqlab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!lead) return;
    const ok = await confirm({
      title: `${lead.name} arizasini o‘chirasizmi?`,
      description:
        'Ariza butunlay o‘chadi. Mijoz mos kelmagan bo‘lsa, o‘chirish o‘rniga «Spam» yoki «Yo‘qotildi» statusini qo‘ying — statistika saqlanib qoladi.',
      confirmLabel: 'O‘chirish',
      danger: true,
    });
    if (!ok) return;

    try {
      await adminClient.delete(`/api/admin/leads/${lead.id}`);
      toast.success('Ariza o‘chirildi');
      router.push('/admin/leads');
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'O‘chirib bo‘lmadi');
    }
  }

  return (
    <AdminShell
      title="Ariza"
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/leads">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ro‘yxatga</span>
          </Link>
        </Button>
      }
    >
      {error && <ErrorBox message={error} onRetry={reload} />}

      {loading || !lead ? (
        <FormSkeleton />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          {/* ── Mijoz va aloqa ── */}
          <Card className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink-subtle">
                  <User className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">{lead.name}</h2>
                  <p className="text-xs text-ink-subtle">
                    {formatDateTime(lead.createdAt)} · {timeAgo(lead.createdAt)}
                  </p>
                </div>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>

            {/* Aloqa tugmalari — menejer eng ko'p shularni bosadi */}
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={`tel:${lead.phone}`}>
                  <Phone className="size-4" aria-hidden="true" />
                  {formatUzPhone(lead.phone)}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={telegramLink(lead.phone)} target="_blank" rel="noopener noreferrer">
                  <Send className="size-4" aria-hidden="true" />
                  Telegram
                </a>
              </Button>
            </div>

            {lead.message && (
              <div className="rounded-xl border border-line bg-surface-sunken p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-subtle">
                  <MessageCircle className="size-3.5" aria-hidden="true" />
                  Mijoz izohi
                </p>
                <p className="text-sm whitespace-pre-wrap text-ink">{lead.message}</p>
              </div>
            )}
          </Card>

          {/* ── Status ── */}
          <Card className="flex flex-col gap-3">
            <div>
              <h3 className="font-display font-bold text-ink">Holat</h3>
              <p className="mt-1 text-xs text-ink-subtle">
                «Band qilindi» tanlanganda menejerlar guruhiga Telegram xabari boradi.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={saving}
                  onClick={() => void changeStatus(status)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                    lead.status === status
                      ? 'border-gold-500 bg-gold-500 text-navy-950'
                      : 'border-line-strong text-ink-muted hover:border-ink/40 hover:text-ink',
                  )}
                >
                  {LEAD_STATUS_LABELS[status].uz}
                </button>
              ))}
            </div>

            {lead.contactedAt && (
              <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <Clock className="size-3.5" aria-hidden="true" />
                Bog‘lanilgan: {formatDateTime(lead.contactedAt)}
              </p>
            )}
          </Card>

          {/* ── Menejer izohi ── */}
          <Card className="flex flex-col gap-3">
            <Field
              label="Menejer izohi"
              hint="Suhbat natijasi, kelishilgan sana, mijoz talablari — jamoa ko‘radi."
            >
              <textarea
                value={noteValue}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Masalan: 28-oktabr Turkiyaga 2 kishi, oldindan to‘lov kutilmoqda"
                className={cn(inputStyles, 'resize-y')}
              />
            </Field>

            {noteChanged && (
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={saving} onClick={() => void saveNote()}>
                  Izohni saqlash
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setNote(null)}>
                  Bekor qilish
                </Button>
              </div>
            )}
          </Card>

          {/* ── Qayerdan kelgani ── */}
          <Card className="flex flex-col gap-3">
            <h3 className="font-display font-bold text-ink">Ariza haqida</h3>

            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-ink-subtle">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  Manba
                </dt>
                <dd className="mt-0.5 text-ink">{sourceLabel(lead.source)}</dd>
              </div>

              <div>
                <dt className="flex items-center gap-1.5 text-xs text-ink-subtle">
                  <Globe className="size-3.5" aria-hidden="true" />
                  Sayt tili
                </dt>
                <dd className="mt-0.5 text-ink">
                  {lead.locale === 'ru' ? 'Ruscha' : 'O‘zbekcha'}
                </dd>
              </div>

              {lead.tour && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-ink-subtle">Qiziqqan tur</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`/uz/turlar/${lead.tour.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
                    >
                      {lead.tour.titleUz}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              )}

              {utmRows(lead).map((row) => (
                <div key={row.label}>
                  <dt className="text-xs text-ink-subtle">{row.label}</dt>
                  <dd className="mt-0.5 break-all text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="flex justify-end pb-8">
            <Button type="button" variant="ghost" onClick={() => void remove()}>
              <Trash2 className="size-4" aria-hidden="true" />
              Arizani o‘chirish
            </Button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
