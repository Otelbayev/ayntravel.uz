'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Paginated } from '@ayntravel/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { allFields, type ModelConfig } from '@/lib/admin-models';
import { useAdminResource } from '@/hooks/useAdminResource';
import type { Row } from './crud-types';
import { AdminShell } from './AdminShell';
import { EmptyState, ErrorBox, ListSkeleton } from './ui';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { Button } from '@/components/ui/Button';

/**
 * Oddiy modellar uchun ro'yxat sahifasi.
 *
 * Tahrirlash modalda emas, alohida sahifada ochiladi — turlar bilan bir xil
 * tartib. Uzun formalar modalda siqilib qoladi va menejer qayerdaligini
 * yo'qotadi; alohida sahifada esa manzil ham, orqaga tugmasi ham ishlaydi.
 */
export function CrudList({ config }: { config: ModelConfig }) {
  const toast = useToast();
  const confirm = useConfirm();

  const {
    data,
    loading,
    error,
    reload,
    setData,
  } = useAdminResource<Paginated<Row> | Row[]>(`${config.endpoint}?pageSize=60`);

  // Server ba'zi modellarni sahifalab, ba'zilarini oddiy massiv qaytaradi.
  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data.items;
  }, [data]);

  async function remove(row: Row) {
    const name = String(row[config.titleField] ?? row.id);
    const ok = await confirm({
      title: `«${name}» ni o‘chirasizmi?`,
      description: 'Bu amalni qaytarib bo‘lmaydi.',
      confirmLabel: 'O‘chirish',
      danger: true,
    });
    if (!ok) return;

    try {
      await adminClient.delete(`${config.endpoint}/${row.id}`);
      // Ro'yxatni serverdan qayta so'ramasdan darhol olib tashlaymiz.
      setData((prev) => {
        if (!prev) return prev;
        if (Array.isArray(prev)) return prev.filter((r) => r.id !== row.id);
        return { ...prev, items: prev.items.filter((r) => r.id !== row.id), total: prev.total - 1 };
      });
      toast.success('O‘chirildi');
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'O‘chirib bo‘lmadi');
    }
  }

  const fields = allFields(config);
  const metaFields = fields.filter((f) => f.inTable);
  const firstBilingual = fields.find((f) => f.bilingual);

  return (
    <AdminShell
      title={config.title}
      actions={
        <Button asChild size="sm">
          <Link href={`/admin/${config.path}/new`}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Qo‘shish</span>
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorBox message={error} onRetry={reload} />}

        {loading && rows.length === 0 ? (
          <ListSkeleton rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState title="Hozircha yozuv yo‘q" hint={config.emptyHint} />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
              >
                <Link href={`/admin/${config.path}/${row.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {String(row[config.titleField] ?? '—')}
                  </p>

                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-subtle">
                    {metaFields.map((field) => {
                      const key = field.bilingual ? `${field.name}Uz` : field.name;
                      const value = row[key];
                      if (value === null || value === undefined || value === '') return null;
                      return (
                        <span key={key}>
                          {field.label}: {String(value).slice(0, 60)}
                        </span>
                      );
                    })}

                    {/* Bir qarashda ko'rinadigan holat belgilari */}
                    {row.status === 'DRAFT' && <span className="text-amber-600">Qoralama</span>}
                    {firstBilingual && !row[`${firstBilingual.name}Ru`] && (
                      <span className="text-amber-600">RU tarjima yo‘q</span>
                    )}
                    {row.isActive === false && <span>O‘chirilgan</span>}
                  </div>
                </Link>

                <div className="flex shrink-0 gap-1">
                  <Link
                    href={`/admin/${config.path}/${row.id}`}
                    aria-label="Tahrirlash"
                    className="rounded-lg p-2 text-ink-subtle transition-colors hover:bg-ink/5 hover:text-accent"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    aria-label="O‘chirish"
                    className="rounded-lg p-2 text-ink-subtle transition-colors hover:bg-hot-500/10 hover:text-hot-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
