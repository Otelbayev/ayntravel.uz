'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { slugify, type MediaDTO } from '@/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { allFields, type ModelConfig } from '@/lib/admin-models';
import type { FieldDef, Row } from './crud-types';
import { langSuffix } from './crud-types';
import { AdminShell } from './AdminShell';
import { ErrorBox, Field, FormSkeleton, inputStyles } from './ui';
import { FormSection, FormShell, Required } from './FormShell';
import { MediaField, MediaPicker } from './MediaPicker';
import { useToast } from './Toast';
import { cn } from '@/lib/utils';

type Lang = 'uz' | 'ru';

interface Props {
  config: ModelConfig;
  /** Mavjud yozuv id'si — tahrirlash rejimi. Bo'sh bo'lsa yangi yaratiladi. */
  id?: string;
}

/**
 * Oddiy modellar uchun to'liq sahifali forma.
 *
 * Maydonlar `admin-models.ts` dagi bo'limlarga qarab chiziladi: birinchi
 * bo'lim ochiq (majburiy maydonlar), qolganlari yig'ilgan. Shu tufayli
 * ekran ochilganda menejer nima to'ldirish kerakligini darhol ko'radi.
 */
export function CrudForm({ config, id }: Props) {
  const toast = useToast();
  const router = useRouter();
  const isEdit = Boolean(id);

  /*
   * Yaratish rejimida boshlang'ich qiymatlar birinchi renderda hisoblanadi
   * (lazy initializer). Effekt ichida `setForm` chaqirish ortiqcha qayta
   * renderga olib kelardi.
   */
  const [form, setForm] = useState<Record<string, unknown>>(() => {
    if (id) return {};
    const initial: Record<string, unknown> = {};
    for (const field of allFields(config)) {
      if (field.bilingual) {
        initial[`${field.name}Uz`] = field.defaultValue ?? '';
        initial[`${field.name}Ru`] = '';
      } else {
        initial[field.name] =
          field.defaultValue ??
          (field.type === 'checkbox' ? true : field.type === 'number' ? 0 : '');
      }
    }
    return initial;
  });
  const [mediaCache, setMediaCache] = useState<Record<string, MediaDTO | null>>({});
  const [mediaField, setMediaField] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('uz');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const fields = useMemo(() => allFields(config), [config]);
  const hasStatus = fields.some((f) => f.name === 'status');
  const hasBilingual = fields.some((f) => f.bilingual);

  // ── Boshlang'ich qiymatlar ──────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    adminClient
      .get<Row>(`${config.endpoint}/${id}`)
      .then((row) => {
        if (!active) return;
        const initial: Record<string, unknown> = {};
        const media: Record<string, MediaDTO | null> = {};

        for (const field of fields) {
          if (field.bilingual) {
            initial[`${field.name}Uz`] = row[`${field.name}Uz`] ?? '';
            initial[`${field.name}Ru`] = row[`${field.name}Ru`] ?? '';
          } else if (field.type === 'media') {
            // DTO'da rasm obyekt sifatida keladi, formada esa id kerak.
            const value = row[field.name.replace(/Id$/, '')] as MediaDTO | null | undefined;
            initial[field.name] = value?.id ?? null;
            media[field.name] = value ?? null;
          } else if (field.type === 'password') {
            // Parol hech qachon qaytarilmaydi — maydon bo'sh qoladi.
            initial[field.name] = '';
          } else {
            initial[field.name] = row[field.name] ?? '';
          }
        }

        setForm(initial);
        setMediaCache(media);
      })
      .catch((err) => {
        if (active) setError(err instanceof AdminApiError ? err.message : 'Yuklanmadi');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      // Sahifa almashsa eskirgan javobni qabul qilmaymiz.
      active = false;
    };
  }, [config.endpoint, id, isEdit, fields]);

  function setValue(name: string, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
  }

  async function submit(nextStatus: 'DRAFT' | 'PUBLISHED') {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload: Record<string, unknown> = { ...form };

    // Raqamli maydonlarni songa keltiramiz.
    for (const field of fields) {
      if (field.type === 'number') {
        const value = payload[field.name];
        payload[field.name] = value === '' || value === null ? 0 : Number(value);
      }
      // Bo'sh parol yuborilmaydi — aks holda mavjud parol o'chib ketadi.
      if (field.type === 'password' && !payload[field.name]) {
        delete payload[field.name];
      }
      // Slug bo'sh bo'lsa manba maydondan yasaymiz.
      if (field.type === 'slug' && !payload[field.name] && field.slugFrom) {
        const source = form[field.slugFrom];
        if (typeof source === 'string') payload[field.name] = slugify(source);
      }
    }

    if (hasStatus) payload.status = nextStatus;

    try {
      if (isEdit) {
        await adminClient.patch(`${config.endpoint}/${id}`, payload);
        toast.success('Saqlandi', 'O‘zgarishlar saytda darhol ko‘rinadi');
      } else {
        await adminClient.post(config.endpoint, payload);
        toast.success(`Yangi ${config.singular} qo‘shildi`);
      }
      setDirty(false);
      router.push(`/admin/${config.path}`);
      router.refresh();
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
        if (err.fields) setFieldErrors(err.fields);
        toast.error(err.message, 'To‘ldirilmagan maydonlarni tekshiring');
      } else {
        setError('Saqlab bo‘lmadi');
        toast.error('Saqlab bo‘lmadi');
      }
    } finally {
      setSaving(false);
    }
  }

  function renderField(field: FieldDef) {
    const name = field.bilingual ? `${field.name}${langSuffix(lang)}` : field.name;
    const value = form[name];
    const error = fieldErrors[name]?.[0];

    const label = (
      <>
        {field.bilingual ? `${field.label} (${lang.toUpperCase()})` : field.label}
        {field.required && (!field.bilingual || lang === 'uz') && <Required />}
      </>
    );

    // Status maydoni forma pastidagi tugmalar bilan boshqariladi — ikki
    // marta ko'rsatish chalkashlik tug'diradi.
    if (field.name === 'status') return null;

    switch (field.type) {
      case 'textarea':
      case 'html':
        return (
          <Field key={name} label={label} hint={field.hint} error={error}>
            <textarea
              value={String(value ?? '')}
              onChange={(e) => setValue(name, e.target.value)}
              rows={field.type === 'html' ? 12 : 3}
              placeholder={field.placeholder}
              className={cn(inputStyles, 'resize-y', field.type === 'html' && 'font-mono text-xs')}
            />
          </Field>
        );

      case 'number':
        return (
          <Field key={name} label={label} hint={field.hint} error={error}>
            <input
              type="number"
              value={String(value ?? '')}
              onChange={(e) => setValue(name, e.target.value)}
              className={cn(inputStyles, 'sm:max-w-xs')}
            />
          </Field>
        );

      case 'password':
        return (
          <Field key={name} label={label} hint={field.hint} error={error}>
            <input
              type="password"
              autoComplete="new-password"
              value={String(value ?? '')}
              onChange={(e) => setValue(name, e.target.value)}
              placeholder={isEdit ? '••••••••' : ''}
              className={cn(inputStyles, 'sm:max-w-xs')}
            />
          </Field>
        );

      case 'checkbox':
        return (
          <label
            key={name}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
          >
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => setValue(name, e.target.checked)}
              className="size-4 accent-[#D4AF37]"
            />
            {field.label}
            {field.hint && <span className="text-xs text-ink-subtle">({field.hint})</span>}
          </label>
        );

      case 'select':
        return (
          <Field key={name} label={label} hint={field.hint} error={error}>
            <select
              value={String(value ?? '')}
              onChange={(e) => setValue(name, e.target.value)}
              className={cn(inputStyles, 'sm:max-w-xs')}
            >
              <option value="">—</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        );

      case 'media':
        return (
          <MediaField
            key={name}
            label={field.label}
            media={mediaCache[name] ?? null}
            onPick={() => setMediaField(name)}
            onClear={() => {
              setValue(name, null);
              setMediaCache((prev) => ({ ...prev, [name]: null }));
            }}
          />
        );

      case 'slug':
        return (
          <Field key={name} label={label} hint={field.hint} error={error}>
            <input
              value={String(value ?? '')}
              onChange={(e) => setValue(name, slugify(e.target.value))}
              onFocus={() => {
                // Bo'sh bo'lsa manba maydondan avtomatik to'ldiramiz.
                if (!value && field.slugFrom) {
                  const source = form[field.slugFrom];
                  if (typeof source === 'string' && source) setValue(name, slugify(source));
                }
              }}
              placeholder={field.placeholder}
              className={inputStyles}
            />
          </Field>
        );

      default:
        return (
          <Field key={name} label={label} hint={field.hint} error={error}>
            <input
              value={String(value ?? '')}
              onChange={(e) => setValue(name, e.target.value)}
              placeholder={field.placeholder}
              className={inputStyles}
            />
          </Field>
        );
    }
  }

  const title = isEdit
    ? `${config.singular.charAt(0).toUpperCase()}${config.singular.slice(1)}ni tahrirlash`
    : `Yangi ${config.singular}`;

  const currentStatus = (form.status as 'DRAFT' | 'PUBLISHED') ?? 'PUBLISHED';

  return (
    <AdminShell title={title}>
      {loading ? (
        <FormSkeleton />
      ) : (
        <>
          <FormShell
            onSubmit={submit}
            saving={saving}
            // Statussiz modellar (xizmat, FAQ) uchun «Nashr etish» tugmasi
            // «Saqlash» ma'nosini beradi — ular doim ko'rinadi.
            status={hasStatus ? currentStatus : 'PUBLISHED'}
            isEdit={isEdit}
            dirty={dirty}
            onCancel={() => router.push(`/admin/${config.path}`)}
          >
            {error && <ErrorBox message={error} />}

            {hasBilingual && (
              <div className="flex flex-wrap items-center gap-2">
                {(['uz', 'ru'] as Lang[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
                      lang === code
                        ? 'border-gold-500 bg-gold-500 text-navy-950'
                        : 'border-line-strong text-ink-muted hover:text-ink',
                    )}
                  >
                    {code === 'uz' ? "O'zbekcha" : 'Ruscha'}
                  </button>
                ))}
                <span className="text-xs text-ink-subtle">
                  {lang === 'ru'
                    ? 'Bo‘sh qoldirsangiz, saytda o‘zbekcha matn ko‘rinadi'
                    : 'Asosiy til'}
                </span>
              </div>
            )}

            {config.sections.map((section, index) => (
              <FormSection
                key={section.title}
                title={section.title}
                hint={section.hint}
                locked={section.locked}
                defaultOpen={index === 0}
              >
                {section.fields.map(renderField)}
              </FormSection>
            ))}
          </FormShell>

          <MediaPicker
            open={mediaField !== null}
            onClose={() => setMediaField(null)}
            onSelect={(media) => {
              if (!mediaField || !media[0]) return;
              setValue(mediaField, media[0].id);
              setMediaCache((prev) => ({ ...prev, [mediaField]: media[0] }));
            }}
          />
        </>
      )}
    </AdminShell>
  );
}
