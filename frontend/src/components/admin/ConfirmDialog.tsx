'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Tasdiqlash oynasi — brauzerning `confirm()` o'rniga.
 *
 * `confirm()` ning uchta muammosi bor: sayt uslubiga mos kelmaydi,
 * matnni formatlab bo'lmaydi (qaysi yozuv o'chirilayotganini ta'kidlash),
 * va ba'zi brauzerlarda «bu sayt boshqa dialog ko'rsatmasin» degan
 * belgi qo'yilsa, umuman ishlamay qoladi — natijada o'chirish jimgina
 * bajarilib ketishi mumkin edi.
 *
 * Ishlatish:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: '...', confirmLabel: 'O‘chirish' })) { ... }
 */

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `true` — amal xavfli (o'chirish), tugma qizil bo'ladi. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm faqat <ConfirmProvider> ichida ishlaydi');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // Promise'ni ochiq qoldiramiz va foydalanuvchi javob berganda yopamiz.
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setOptions(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Dialog.Root
        open={options !== null}
        // Escape yoki tashqariga bosish — bekor qilish bilan bir xil
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/50 backdrop-blur-sm data-[state=open]:animate-[fade-in_150ms_ease-out]" />

          <Dialog.Content className="fixed top-1/2 left-1/2 z-[95] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface-raised p-6 shadow-2xl data-[state=open]:animate-[dialog-in_180ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex gap-4">
              {options?.danger && (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hot-500/10 text-hot-500">
                  <AlertTriangle className="size-5" aria-hidden="true" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <Dialog.Title className="font-display text-lg font-bold text-ink">
                  {options?.title}
                </Dialog.Title>

                {options?.description && (
                  <Dialog.Description className="mt-2 text-sm text-ink-muted">
                    {options.description}
                  </Dialog.Description>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => settle(false)}>
                {options?.cancelLabel ?? 'Bekor qilish'}
              </Button>
              <Button
                type="button"
                variant={options?.danger ? 'danger' : 'primary'}
                onClick={() => settle(true)}
                // Xavfli amalda fokus avtomatik shu tugmaga tushmasin —
                // tasodifiy Enter bosish yozuvni o'chirib yubormasligi kerak.
                autoFocus={!options?.danger}
              >
                {options?.confirmLabel ?? 'Tasdiqlash'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  );
}
