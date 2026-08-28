'use client';

import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { LEAD_STATUS_LABELS, type ContentStatus, type LeadStatus } from '@ayntravel/shared';
import { cn } from '@/lib/utils';

/** Admin panelning takrorlanuvchi mayda qismlari shu faylda jamlangan. */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-line bg-surface p-5', className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'gold' | 'hot' | 'green';
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs tracking-wide text-ink-subtle uppercase">{label}</span>
      <span
        className={cn(
          'font-display text-3xl font-black',
          accent === 'gold' && 'text-accent',
          accent === 'hot' && 'text-hot-400',
          accent === 'green' && 'text-emerald-400',
          !accent && 'text-ink',
        )}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
    </Card>
  );
}

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: 'bg-gold-500/15 text-accent border-gold-500/30',
  CONTACTED: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  BOOKED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  LOST: 'bg-ink/8 text-ink-muted border-line-strong',
  SPAM: 'bg-hot-500/15 text-hot-400 border-hot-500/30',
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        LEAD_STATUS_STYLES[status],
      )}
    >
      {LEAD_STATUS_LABELS[status].uz}
    </span>
  );
}

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        status === 'PUBLISHED'
          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
          : 'border-line-strong bg-ink/8 text-ink-muted',
      )}
    >
      {status === 'PUBLISHED' ? 'Nashr etilgan' : 'Qoralama'}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Loader2 className="size-6 animate-spin text-accent" aria-label="Yuklanmoqda" />
    </div>
  );
}

/*
 * Skeletonlar — yuklanish paytida sahifa tuzilishi ko'rinib turadi.
 * Aylanuvchi spinner o'rniga skeleton kutish vaqtini qisqaroq his qildiradi
 * va kontent kelganda sahifa "sakramaydi" (layout shift bo'lmaydi).
 */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-2" aria-label="Yuklanmoqda" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
        >
          <div className="flex-1">
            <div className="h-4 w-1/3 animate-pulse rounded bg-ink/10" />
            <div className="mt-2 h-3 w-1/4 animate-pulse rounded bg-ink/5" />
          </div>
          <div className="size-8 animate-pulse rounded-lg bg-ink/5" />
        </li>
      ))}
    </ul>
  );
}

export function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Yuklanmoqda" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-5">
          <div className="h-4 w-40 animate-pulse rounded bg-ink/10" />
          <div className="mt-4 flex flex-col gap-3">
            <div className="h-10 animate-pulse rounded-lg bg-ink/5" />
            <div className="h-10 w-2/3 animate-pulse rounded-lg bg-ink/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl border border-hot-500/30 bg-hot-500/8 px-4 py-3 text-sm text-hot-400"
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-semibold underline hover:no-underline"
        >
          Qayta urinish
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Gorizontal scroll bilan jadval — mobil qurilmada ustunlar siqilib ketmasin. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'border-b border-line bg-surface px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-subtle uppercase',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={cn('border-b border-line px-4 py-3 text-ink', className)}>{children}</td>
  );
}

export const inputStyles =
  'w-full rounded-lg border border-line-strong bg-surface-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-colors focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 focus:outline-none disabled:opacity-50';

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  /** Matn yoki JSX — masalan majburiy maydon uchun `<Required />` belgisi bilan. */
  label?: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-ink-muted">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-ink-subtle">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-hot-400">
          {error}
        </p>
      )}
    </div>
  );
}
