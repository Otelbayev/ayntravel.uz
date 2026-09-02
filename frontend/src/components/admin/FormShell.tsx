'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, Eye, Loader2, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Admin formalari uchun umumiy qobiq.
 *
 * Maqsad — «bir qarashda tushunarli» forma. Uchta qoida:
 *  1. Majburiy maydonlar birinchi bo'limda, doim ochiq.
 *  2. Qolgan hamma narsa yig'ilgan bo'limlarda — ekran to'lib ketmaydi.
 *  3. Pastda ikkita aniq amal: «Qoralama» va «Nashr etish». Status tanlaydigan
 *     select emas — menejer nima bo'lishini tugma nomidan biladi.
 */

interface FormSectionProps {
  title: string;
  /** Bo'lim nima uchun kerakligi — bir qatorlik izoh. */
  hint?: string;
  children: ReactNode;
  /** Boshlang'ich holatda ochiqmi. Majburiy bo'lim uchun `true`. */
  defaultOpen?: boolean;
  /** Yig'ilmaydigan bo'lim — doim ochiq, o'q ko'rsatilmaydi. */
  locked?: boolean;
  /** O'ng tomondagi qisqa holat matni: «3 ta shahar», «to'ldirilmagan». */
  badge?: ReactNode;
}

/**
 * Yig'iladigan bo'lim.
 *
 * `<details>` elementi asosida: JavaScript yuklanmagan holatda ham
 * ochilib-yopiladi va klaviatura bilan to'liq boshqariladi.
 */
export function FormSection({
  title,
  hint,
  children,
  defaultOpen = false,
  locked = false,
  badge,
}: FormSectionProps) {
  if (locked) {
    return (
      <section className="rounded-xl border border-line bg-surface p-5">
        <header className="mb-4">
          <h2 className="font-display font-bold text-ink">{title}</h2>
          {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
        </header>
        <div className="flex flex-col gap-4">{children}</div>
      </section>
    );
  }

  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-line bg-surface [&[open]>summary_.chevron]:rotate-180"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-bold text-ink">{title}</h2>
          {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
        </div>

        {badge && <span className="shrink-0 text-xs text-ink-subtle">{badge}</span>}

        <ChevronDown
          className="chevron size-5 shrink-0 text-ink-subtle transition-transform duration-200"
          aria-hidden="true"
        />
      </summary>

      <div className="flex flex-col gap-4 border-t border-line p-5">{children}</div>
    </details>
  );
}

interface FormShellProps {
  children: ReactNode;
  onSubmit: (status: 'DRAFT' | 'PUBLISHED') => Promise<void> | void;
  saving?: boolean;
  /** Hozirgi holat — tugma matnini aniqlaydi. */
  status?: 'DRAFT' | 'PUBLISHED';
  /** Tahrirlash rejimimi (tugma matni farq qiladi). */
  isEdit?: boolean;
  /** Saqlanmagan o'zgarish bormi — sahifadan chiqishda ogohlantirish uchun. */
  dirty?: boolean;
  /** Nashr etilgan yozuvni saytda ko'rish havolasi. */
  previewUrl?: string;
  onCancel?: () => void;
}

export function FormShell({
  children,
  onSubmit,
  saving = false,
  status = 'DRAFT',
  isEdit = false,
  dirty = false,
  previewUrl,
  onCancel,
}: FormShellProps) {
  const [pending, setPending] = useState<'DRAFT' | 'PUBLISHED' | null>(null);

  /*
   * Saqlanmagan o'zgarishlar himoyasi.
   * Menejer uzun formani to'ldirib, tasodifan sahifani yopsa yoki
   * yangilasa — barcha mehnat yo'qoladi. Brauzerning o'z ogohlantirishi
   * bu holatni ishonchli ushlaydi.
   */
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Zamonaviy brauzerlar matnni ko'rsatmaydi, lekin qaytarish shart.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  async function handle(target: 'DRAFT' | 'PUBLISHED', event: FormEvent) {
    event.preventDefault();
    setPending(target);
    try {
      await onSubmit(target);
    } finally {
      setPending(null);
    }
  }

  return (
    <form
      // Enter bosilganda «Nashr etish» emas, joriy holatda saqlash ishlasin.
      onSubmit={(e) => void handle(status, e)}
      className="flex flex-col gap-4 pb-28"
    >
      {children}

      {/* Yopishib turuvchi amal paneli */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface-raised/95 p-4 backdrop-blur-xl lg:pl-64">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {dirty && (
            <span className="mr-auto text-xs text-amber-600">Saqlanmagan o‘zgarishlar bor</span>
          )}

          {previewUrl && status === 'PUBLISHED' && (
            <Button asChild variant="ghost" size="sm">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="size-4" aria-hidden="true" />
                Saytda ko‘rish
              </a>
            </Button>
          )}

          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Bekor qilish
            </Button>
          )}

          {/* Qoralama — saytda ko'rinmaydi */}
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={(e) => void handle('DRAFT', e)}
          >
            {pending === 'DRAFT' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            Qoralama
          </Button>

          {/* Asosiy amal — saytga chiqarish */}
          <Button
            type="button"
            disabled={saving}
            onClick={(e) => void handle('PUBLISHED', e)}
          >
            {pending === 'PUBLISHED' ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {status === 'PUBLISHED' && isEdit ? 'Saqlash' : 'Nashr etish'}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Majburiy maydon belgisi — nima to'ldirilishi shartligi darhol ko'rinadi. */
export function Required() {
  return (
    <span className="ml-0.5 text-hot-500" aria-label="majburiy">
      *
    </span>
  );
}

/** Bo'lim ichida ikki ustunli joylashuv. */
export function FieldRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-4 sm:grid-cols-2', className)}>{children}</div>;
}
