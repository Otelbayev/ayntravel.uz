'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/*
 * Maydon foni `bg-surface-raised` — oq sahifada oq, to'q blokda navy.
 * Chegara ko'rinadigan bo'lishi kerak: oq fonda fonsiz maydonni
 * foydalanuvchi umuman sezmaydi.
 */
const fieldStyles =
  'w-full rounded-xl border border-line-strong bg-surface-raised px-4 py-3 text-ink placeholder:text-ink-subtle transition-colors focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25 focus:outline-none disabled:opacity-50';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink-muted">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(fieldStyles, error && 'border-hot-400 focus:border-hot-400', className)}
        // Xatoni skrinrider ham e'lon qilsin
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-sm text-hot-400">
          {error}
        </p>
      )}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink-muted">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={3}
        className={cn(fieldStyles, 'resize-none', error && 'border-hot-400', className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-hot-400">
          {error}
        </p>
      )}
    </div>
  );
});
