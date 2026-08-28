'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, Phone, Send } from 'lucide-react';
import { type LeadSource, normalizeUzPhone } from '@ayntravel/shared';
import { api, ApiError } from '@/lib/api';
import { captureUtm, getUtm } from '@/lib/utm';
import { maskUzPhone } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Link } from '@/i18n/routing';

interface LeadFormProps {
  source: LeadSource;
  tourId?: string;
  /** Izoh maydonini ko'rsatish (qisqa formalarda kerak emas). */
  withMessage?: boolean;
  phone?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Saytdagi barcha arizalar shu komponent orqali yuboriladi.
 *
 * Spamga qarshi uch qatlam:
 *  1. `website` — honeypot: ekranda ko'rinmaydi, bot to'ldiradi
 *  2. `renderedAt` — forma ochilgan vaqt; 2.5 soniyadan tez yuborilsa rad etiladi
 *  3. server tomonda IP bo'yicha soatiga 5 ta cheklov
 */
export function LeadForm({
  source,
  tourId,
  withMessage = true,
  phone,
  className,
  compact = false,
}: LeadFormProps) {
  const t = useTranslations('form');
  const locale = useLocale() as 'uz' | 'ru';

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState('');

  /*
   * Forma qachon chizilgani — bot tekshiruvi uchun.
   * Boshlang'ich qiymat 0: `Date.now()` render paytida chaqirilsa komponent
   * nopok bo'ladi (har renderda boshqa natija). Haqiqiy vaqt quyidagi
   * effektda, ya'ni brauzerda bir marta o'rnatiladi.
   */
  const renderedAt = useRef<number>(0);

  useEffect(() => {
    captureUtm();
    renderedAt.current = Date.now();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setServerError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const rawPhone = String(formData.get('phone') ?? '');
    const message = String(formData.get('message') ?? '').trim();
    const website = String(formData.get('website') ?? '');

    // Klient tomonda ham tekshiramiz — foydalanuvchi xatoni darhol ko'rsin.
    const nextErrors: Record<string, string> = {};
    if (name.length < 2) nextErrors.name = locale === 'ru' ? 'Введите имя' : 'Ismingizni kiriting';
    if (!normalizeUzPhone(rawPhone)) {
      nextErrors.phone =
        locale === 'ru'
          ? 'Неверный номер. Например: +998 90 123 45 67'
          : 'Raqam noto‘g‘ri. Masalan: +998 90 123 45 67';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStatus('sending');

    try {
      await api.createLead({
        name,
        phone: rawPhone,
        message: message || undefined,
        tourId,
        source,
        locale,
        utm: getUtm(),
        website,
        renderedAt: renderedAt.current,
      });
      setStatus('success');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) {
          setErrors(
            Object.fromEntries(
              Object.entries(err.fields).map(([key, msgs]) => [key, msgs[0] ?? '']),
            ),
          );
        }
        setServerError(err.message);
      } else {
        setServerError(t('error'));
      }
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-card border border-gold-500/30 bg-gold-500/5 p-8 text-center',
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="size-12 text-accent" aria-hidden="true" />
        <h3 className="font-display text-xl font-bold text-ink">{t('success')}</h3>
        <p className="text-sm text-ink-muted">{t('successHint')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4', className)} noValidate>
      {!compact && (
        <div className="mb-1">
          <h3 className="font-display text-2xl font-bold text-ink">{t('title')}</h3>
          <p className="mt-1.5 text-sm text-ink-muted">{t('subtitle')}</p>
        </div>
      )}

      {/*
        Honeypot. Odam buni ko'rmaydi va fokus ham ololmaydi, lekin
        avtomatik to'ldiruvchi bot uni bo'sh qoldirmaydi.
        `display:none` emas — ba'zi botlar yashirin maydonlarni o'tkazib yuboradi.
      */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor={`website-${source}`}>Website</label>
        <input
          type="text"
          id={`website-${source}`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Input
        name="name"
        label={t('name')}
        placeholder={t('namePlaceholder')}
        autoComplete="name"
        required
        error={errors.name}
      />

      <Input
        name="phone"
        type="tel"
        inputMode="tel"
        label={t('phone')}
        placeholder={t('phonePlaceholder')}
        autoComplete="tel"
        required
        value={phoneValue}
        onChange={(e) => setPhoneValue(maskUzPhone(e.target.value))}
        error={errors.phone}
      />

      {withMessage && (
        <Textarea
          name="message"
          label={t('message')}
          placeholder={t('messagePlaceholder')}
          maxLength={1000}
        />
      )}

      {serverError && (
        <p role="alert" className="rounded-lg bg-hot-500/10 px-3 py-2 text-sm text-hot-400">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === 'sending'} className="mt-1 w-full">
        {status === 'sending' ? (
          t('submitting')
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            {t('submit')}
          </>
        )}
      </Button>

      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center justify-center gap-2 text-sm text-ink-muted transition-colors hover:text-accent"
        >
          <Phone className="size-4" aria-hidden="true" />
          {t('orCall')} {phone}
        </a>
      )}

      <p className="text-center text-xs leading-relaxed text-ink-subtle">
        {t.rich('agreement', {
          privacy: (chunks) => (
            <Link href="/maxfiylik-siyosati" className="underline hover:text-accent">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
