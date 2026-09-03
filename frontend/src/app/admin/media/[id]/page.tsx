'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import type { MediaDTO } from '@/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { useAdminResource } from '@/hooks/useAdminResource';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, ErrorBox, Field, FormSkeleton, inputStyles } from '@/components/admin/ui';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/** Serverdan qo'shimcha maydonlar bilan keladi (`GET /api/admin/media/:id`). */
interface MediaDetail extends MediaDTO {
  originalName: string;
  sizeBytes: number;
  createdAt: string;
  usage: {
    tourPosters: number;
    tourGallery: number;
    destinationHeros: number;
    postCovers: number;
    testimonials: number;
    heroBackground: number;
    total: number;
  };
}

const USAGE_LABELS: Record<string, string> = {
  tourPosters: 'Tur posteri',
  tourGallery: 'Tur galereyasi',
  destinationHeros: 'Yo‘nalish rasmi',
  postCovers: 'Maqola muqovasi',
  testimonials: 'Mijoz rasmi',
  heroBackground: 'Bosh sahifa foni',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Rasm kartochkasi: alt matnini tahrirlash va rasm qayerda
 * ishlatilayotganini ko'rish.
 *
 * Alt matn SEO va skrinriderlar uchun muhim — ro'yxatda uni yozish noqulay,
 * shuning uchun alohida sahifa.
 */
export default function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();

  const { data, loading, error, reload, setData } = useAdminResource<MediaDetail>(
    `/api/admin/media/${id}`,
  );

  const [altUz, setAltUz] = useState<string | null>(null);
  const [altRu, setAltRu] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isVideo = data?.kind === 'VIDEO';

  const uzValue = altUz ?? data?.altUz ?? '';
  const ruValue = altRu ?? data?.altRu ?? '';
  const changed =
    data !== null && (uzValue !== (data?.altUz ?? '') || ruValue !== (data?.altRu ?? ''));

  async function save() {
    if (!data) return;
    setSaving(true);
    try {
      await adminClient.patch(`/api/admin/media/${data.id}`, { altUz: uzValue, altRu: ruValue });
      setData((prev) => (prev ? { ...prev, altUz: uzValue, altRu: ruValue } : prev));
      setAltUz(null);
      setAltRu(null);
      toast.success('Alt matn saqlandi', 'Qidiruv tizimlari va skrinriderlar uchun');
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Saqlab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!data) return;
    const ok = await confirm({
      title: 'Rasmni o‘chirasizmi?',
      description:
        data.usage.total > 0
          ? `Bu rasm ${data.usage.total} ta joyda ishlatilmoqda — avval u yerlardan olib tashlash kerak.`
          : 'Rasm va uning barcha formatlari serverdan butunlay o‘chadi.',
      confirmLabel: 'O‘chirish',
      danger: true,
    });
    if (!ok) return;

    try {
      await adminClient.delete(`/api/admin/media/${data.id}`);
      toast.success('Rasm o‘chirildi');
      router.push('/admin/media');
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'O‘chirib bo‘lmadi');
    }
  }

  const usageRows = data
    ? Object.entries(data.usage)
        .filter(([key, value]) => key !== 'total' && value > 0)
        .map(([key, value]) => ({ label: USAGE_LABELS[key] ?? key, count: value }))
    : [];

  return (
    <AdminShell
      title="Rasm"
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/media">
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ro‘yxatga</span>
          </Link>
        </Button>
      }
    >
      {error && <ErrorBox message={error} onRetry={reload} />}

      {loading || !data ? (
        <FormSkeleton />
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          <Card className="flex flex-col gap-5 sm:flex-row">
            {/* Ko'rib chiqish — rasm 4:5 Instagram nisbatida, video 16:9 */}
            <div
              className={cn(
                'relative w-full shrink-0 overflow-hidden rounded-xl border border-line bg-navy-950 sm:w-56',
                isVideo ? 'aspect-video' : 'aspect-[4/5]',
              )}
            >
              {isVideo && data.sourceUrl ? (
                <video
                  src={data.sourceUrl}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover"
                />
              ) : (
                <Image
                  src={data.variants.poster?.webp ?? data.url}
                  alt={data.altUz ?? ''}
                  fill
                  sizes="224px"
                  className="object-cover"
                />
              )}
            </div>

            <dl className="grid flex-1 gap-x-6 gap-y-3 self-start text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-subtle">Fayl nomi</dt>
                <dd className="mt-0.5 break-all text-ink">{data.originalName}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">O‘lcham</dt>
                <dd className="mt-0.5 text-ink">
                  {data.width} × {data.height}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-subtle">Hajmi</dt>
                <dd className="mt-0.5 text-ink">{formatBytes(data.sizeBytes)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-subtle">To‘g‘ridan-to‘g‘ri havola</dt>
                <dd className="mt-0.5">
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 break-all text-accent hover:underline"
                  >
                    ochish
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </dd>
              </div>
            </dl>
          </Card>

          {/* ── Alt matn ── */}
          <Card className="flex flex-col gap-4">
            <div>
              <h3 className="font-display font-bold text-ink">Alt matn</h3>
              <p className="mt-1 text-xs text-ink-subtle">
                Rasmda nima tasvirlanganini yozing. Google shu matnni o‘qiydi va ko‘zi ojiz
                foydalanuvchilarga skrinrider shuni aytadi.
              </p>
            </div>

            <Field label="O‘zbekcha">
              <input
                value={uzValue}
                onChange={(e) => setAltUz(e.target.value)}
                placeholder="Turkiya, Istanbul — Sultonahmad masjidi kunbotarda"
                className={inputStyles}
              />
            </Field>

            <Field label="Ruscha">
              <input
                value={ruValue}
                onChange={(e) => setAltRu(e.target.value)}
                placeholder="Турция, Стамбул — Голубая мечеть на закате"
                className={inputStyles}
              />
            </Field>

            {changed && (
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
                  Saqlash
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAltUz(null);
                    setAltRu(null);
                  }}
                >
                  Bekor qilish
                </Button>
              </div>
            )}
          </Card>

          {/* ── Qayerda ishlatilmoqda ── */}
          <Card className="flex flex-col gap-3">
            <h3 className="font-display font-bold text-ink">Qayerda ishlatilmoqda</h3>

            {usageRows.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Hech qayerda ishlatilmayapti — bemalol o‘chirish mumkin.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {usageRows.map((row) => (
                  <li key={row.label} className="flex justify-between">
                    <span className="text-ink-muted">{row.label}</span>
                    <span className="font-medium text-ink">{row.count} ta</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="flex justify-end pb-8">
            <Button type="button" variant="ghost" onClick={() => void remove()}>
              <Trash2 className="size-4" aria-hidden="true" />
              Rasmni o‘chirish
            </Button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
