'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Admin panel uchun qalqib chiquvchi xabarlar.
 *
 * Nega kerak: menejer «Saqlash» tugmasini bosgach, hech qanday tasdiq
 * ko'rmasa, amal bajarilganini bilmaydi va ikkinchi marta bosadi. Xabar —
 * bu shunchaki bezak emas, ishonch masalasi.
 *
 * Radix `Toast` ishlatiladi: u `aria-live` mintaqasini o'zi boshqaradi,
 * shuning uchun xabar skrinriderga ham e'lon qilinadi, klaviatura bilan
 * yopish (F8) ham ishlaydi.
 */

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Xabar ko'rsatish uchun hook. `ToastProvider` ichida chaqirilishi shart. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast faqat <ToastProvider> ichida ishlaydi');
  return ctx;
}

const STYLES: Record<ToastKind, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/30 bg-emerald-50 text-emerald-900',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-hot-500/30 bg-red-50 text-red-900',
  },
  info: {
    icon: Info,
    className: 'border-line-strong bg-surface-raised text-ink',
  },
};

const ICON_COLOR: Record<ToastKind, string> = {
  success: 'text-emerald-600',
  error: 'text-hot-500',
  info: 'text-ink-muted',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, title: string, description?: string) => {
    // `Date.now()` yetarli emas: bir vaqtda ikkita xabar chiqsa id takrorlanadi.
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, title, description }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      info: (title, description) => push('info', title, description),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {/* Xato xabari uzoqroq turadi — uni o'qib ulgurish kerak */}
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}

        {items.map((item) => {
          const { icon: Icon, className } = STYLES[item.kind];
          return (
            <ToastPrimitive.Root
              key={item.id}
              duration={item.kind === 'error' ? 8000 : 4500}
              onOpenChange={(open) => {
                if (!open) setItems((prev) => prev.filter((x) => x.id !== item.id));
              }}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 shadow-lg',
                'data-[state=open]:animate-[toast-in_220ms_cubic-bezier(0.16,1,0.3,1)]',
                'data-[state=closed]:animate-[toast-out_150ms_ease-in]',
                'data-[swipe=end]:animate-[toast-out_150ms_ease-in]',
                className,
              )}
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', ICON_COLOR[item.kind])} aria-hidden="true" />

              <div className="min-w-0 flex-1">
                <ToastPrimitive.Title className="text-sm font-semibold">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description && (
                  <ToastPrimitive.Description className="mt-0.5 text-sm opacity-80">
                    {item.description}
                  </ToastPrimitive.Description>
                )}
              </div>

              <ToastPrimitive.Close
                aria-label="Yopish"
                className="shrink-0 rounded p-1 opacity-50 transition-opacity hover:opacity-100"
              >
                <X className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}

        <ToastPrimitive.Viewport className="fixed top-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
