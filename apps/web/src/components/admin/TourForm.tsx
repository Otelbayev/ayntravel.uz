'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';
import {
  MEAL_PLANS,
  MEAL_PLAN_LABELS,
  slugify,
  type DestinationDTO,
  type MealPlan,
  type MediaDTO,
  type TourDTO,
} from '@ayntravel/shared';
import { adminClient, AdminApiError } from '@/lib/admin-client';
import { Button } from '@/components/ui/Button';
import { ErrorBox, Field, inputStyles } from './ui';
import { MediaField, MediaPicker } from './MediaPicker';
import { FieldRow, FormSection, FormShell, Required } from './FormShell';
import { useToast } from './Toast';
import { cn } from '@/lib/utils';

interface Props {
  /** Mavjud tur — tahrirlash rejimi. Bo'sh bo'lsa yangi tur yaratiladi. */
  tour?: TourDTO;
}

type Lang = 'uz' | 'ru';

/** Massiv maydonlari (shaharlar, kiradi/kirmaydi) uchun oddiy tahrirlagich. */
function ListEditor({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (!value) return;
    onChange([...values, value]);
    setDraft('');
  }

  return (
    <Field label={label} hint={hint}>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface-sunken px-2.5 py-1.5 text-sm text-ink"
            >
              {value}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                aria-label={`${value} ni olib tashlash`}
                className="text-ink-subtle transition-colors hover:text-hot-500"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter formani yubormasligi kerak — faqat element qo'shadi.
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputStyles}
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </Field>
  );
}

/** UZ | RU almashtirgich. RU to'ldirilmagan bo'lsa belgi ko'rsatiladi. */
function LangTabs({
  lang,
  onChange,
  ruFilled,
}: {
  lang: Lang;
  onChange: (lang: Lang) => void;
  ruFilled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['uz', 'ru'] as Lang[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={cn(
            'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
            lang === code
              ? 'border-gold-500 bg-gold-500 text-navy-950'
              : 'border-line-strong text-ink-muted hover:text-ink',
          )}
        >
          {code === 'uz' ? "O'zbekcha" : 'Ruscha'}
          {code === 'ru' && !ruFilled && (
            <span className="ml-1.5 text-amber-500" title="Tarjima to‘ldirilmagan">
              ●
            </span>
          )}
        </button>
      ))}

      <span className="text-xs text-ink-subtle">
        {lang === 'ru'
          ? 'Bo‘sh qoldirsangiz, saytda o‘zbekcha matn ko‘rinadi'
          : 'Asosiy til — to‘ldirilishi shart'}
      </span>
    </div>
  );
}

export function TourForm({ tour }: Props) {
  const toast = useToast();
  const router = useRouter();
  const isEdit = Boolean(tour);

  const [lang, setLang] = useState<Lang>('uz');
  const [destinations, setDestinations] = useState<DestinationDTO[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [dirty, setDirty] = useState(false);

  const [picker, setPicker] = useState<'poster' | 'gallery' | null>(null);
  const [poster, setPoster] = useState<MediaDTO | null>(tour?.posterImage ?? null);
  const [gallery, setGallery] = useState<MediaDTO[]>(tour?.gallery ?? []);

  const [form, setForm] = useState({
    slug: tour?.slug ?? '',
    titleUz: tour?.titleUz ?? '',
    titleRu: tour?.titleRu ?? '',
    summaryUz: tour?.summaryUz ?? '',
    summaryRu: tour?.summaryRu ?? '',
    bodyUz: tour?.bodyUz ?? '',
    bodyRu: tour?.bodyRu ?? '',
    destinationId: tour?.destination?.id ?? '',
    priceFrom: tour ? String(tour.priceFrom) : '',
    extraFee: tour?.extraFee != null ? String(tour.extraFee) : '',
    currency: tour?.currency ?? 'USD',
    departureDate: tour?.departureDate?.slice(0, 10) ?? '',
    returnDate: tour?.returnDate?.slice(0, 10) ?? '',
    durationDays: tour?.durationDays != null ? String(tour.durationDays) : '',
    durationNights: tour?.durationNights != null ? String(tour.durationNights) : '',
    hotelStars: tour?.hotelStars != null ? String(tour.hotelStars) : '',
    mealPlan: (tour?.mealPlan ?? '') as MealPlan | '',
    seatsLeft: tour?.seatsLeft != null ? String(tour.seatsLeft) : '',
    isHot: tour?.isHot ?? false,
    isFeatured: tour?.isFeatured ?? false,
    seoTitleUz: tour?.seoTitleUz ?? '',
    seoTitleRu: tour?.seoTitleRu ?? '',
    seoDescriptionUz: tour?.seoDescriptionUz ?? '',
    seoDescriptionRu: tour?.seoDescriptionRu ?? '',
  });

  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(tour?.status ?? 'DRAFT');
  const [citiesUz, setCitiesUz] = useState<string[]>(tour?.citiesUz ?? []);
  const [citiesRu, setCitiesRu] = useState<string[]>(tour?.citiesRu ?? []);
  const [includes, setIncludes] = useState<string[]>(tour?.includes ?? []);
  const [excludes, setExcludes] = useState<string[]>(tour?.excludes ?? []);

  useEffect(() => {
    adminClient
      .get<DestinationDTO[]>('/api/admin/destinations')
      .then(setDestinations)
      .catch(() => undefined);
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  /** Yig'ilgan bo'lim sarlavhasida ko'rinadigan qisqa holat. */
  const badges = useMemo(
    () => ({
      details:
        [
          form.durationDays && `${form.durationDays} kun`,
          form.hotelStars && `${form.hotelStars}★`,
          form.mealPlan || null,
        ]
          .filter(Boolean)
          .join(' · ') || 'to‘ldirilmagan',
      content:
        citiesUz.length + includes.length > 0
          ? `${citiesUz.length} shahar · ${includes.length} ta xizmat`
          : 'to‘ldirilmagan',
      gallery: gallery.length > 0 ? `${gallery.length} ta rasm` : 'bo‘sh',
      seo: form.seoTitleUz || form.seoDescriptionUz ? 'to‘ldirilgan' : 'avtomatik',
    }),
    [form, includes, citiesUz, gallery],
  );

  async function submit(nextStatus: 'DRAFT' | 'PUBLISHED') {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    // Bo'sh satrlarni yubormaymiz: raqam maydonlari uchun bo'sh satr
    // server validatsiyasini buzadi.
    const num = (value: string) => (value.trim() === '' ? null : Number(value));

    const payload = {
      ...form,
      status: nextStatus,
      slug: form.slug || slugify(form.titleUz),
      priceFrom: Number(form.priceFrom || 0),
      extraFee: num(form.extraFee),
      departureDate: form.departureDate || null,
      returnDate: form.returnDate || null,
      durationDays: num(form.durationDays),
      durationNights: num(form.durationNights),
      hotelStars: num(form.hotelStars),
      seatsLeft: num(form.seatsLeft),
      mealPlan: form.mealPlan || null,
      citiesUz,
      citiesRu,
      includes,
      excludes,
      posterImageId: poster?.id ?? null,
      galleryImageIds: gallery.map((m) => m.id),
    };

    try {
      if (isEdit) {
        await adminClient.patch(`/api/admin/tours/${tour!.id}`, payload);
        toast.success(
          nextStatus === 'PUBLISHED' ? 'Saqlandi va nashr etildi' : 'Qoralama saqlandi',
          nextStatus === 'PUBLISHED'
            ? 'O‘zgarishlar saytda darhol ko‘rinadi'
            : 'Saytda ko‘rinmaydi',
        );
      } else {
        const created = await adminClient.post<TourDTO>('/api/admin/tours', payload);
        toast.success(
          nextStatus === 'PUBLISHED' ? 'Tur nashr etildi' : 'Qoralama yaratildi',
          nextStatus === 'PUBLISHED'
            ? 'Saytda darhol ko‘rinadi'
            : 'Tayyor bo‘lgach «Nashr etish» tugmasini bosing',
        );
        router.replace(`/admin/tours/${created.id}`);
      }

      setStatus(nextStatus);
      setDirty(false);
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

  const fieldError = (name: string) => fieldErrors[name]?.[0];

  type BilingualBase = 'title' | 'summary' | 'body' | 'seoTitle' | 'seoDescription';
  const bilingual = (base: BilingualBase) =>
    (lang === 'uz' ? form[`${base}Uz`] : form[`${base}Ru`]) as string;
  const setBilingual = (base: BilingualBase, value: string) =>
    set(lang === 'uz' ? (`${base}Uz` as const) : (`${base}Ru` as const), value);

  return (
    <>
      <FormShell
        onSubmit={submit}
        saving={saving}
        status={status}
        isEdit={isEdit}
        dirty={dirty}
        previewUrl={tour ? `/uz/turlar/${tour.slug}` : undefined}
        onCancel={() => router.push('/admin/tours')}
      >
        {error && <ErrorBox message={error} />}

        <LangTabs lang={lang} onChange={setLang} ruFilled={Boolean(form.titleRu)} />

        {/* ── 1. ASOSIY — faqat shu bo'limni to'ldirib nashr etish mumkin ── */}
        <FormSection
          title="Asosiy ma’lumot"
          hint="Shu maydonlar to‘ldirilsa, turni nashr etish mumkin. Qolgan bo‘limlar ixtiyoriy."
          locked
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <MediaField
              label="Poster (Instagram 4:5)"
              media={poster}
              onPick={() => setPicker('poster')}
              onClear={() => {
                setPoster(null);
                setDirty(true);
              }}
            />

            <div className="flex flex-1 flex-col gap-4">
              <Field
                label={
                  <>
                    Tur nomi ({lang.toUpperCase()})
                    {lang === 'uz' && <Required />}
                  </>
                }
                error={fieldError(lang === 'uz' ? 'titleUz' : 'titleRu')}
              >
                <input
                  value={bilingual('title')}
                  onChange={(e) => setBilingual('title', e.target.value)}
                  onBlur={() => {
                    // Slug faqat yangi turda avtomatik yaratiladi — mavjud
                    // turning slugi o'zgarsa eski havolalar buziladi.
                    if (!isEdit && !form.slug && form.titleUz) {
                      set('slug', slugify(form.titleUz));
                    }
                  }}
                  required={lang === 'uz'}
                  placeholder={lang === 'uz' ? 'Turkiya mo‘jizalari' : 'Чудеса Турции'}
                  className={inputStyles}
                />
              </Field>

              <Field
                label={
                  <>
                    Yo‘nalish
                    <Required />
                  </>
                }
                error={fieldError('destinationId')}
              >
                <select
                  value={form.destinationId}
                  onChange={(e) => set('destinationId', e.target.value)}
                  required
                  className={inputStyles}
                >
                  <option value="">Tanlang...</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nameUz}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <FieldRow>
            <Field
              label={
                <>
                  Narx (1 kishi uchun)
                  <Required />
                </>
              }
              error={fieldError('priceFrom')}
            >
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.priceFrom}
                  onChange={(e) => set('priceFrom', e.target.value)}
                  required
                  placeholder="800"
                  className={inputStyles}
                />
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  aria-label="Valyuta"
                  className={cn(inputStyles, 'w-24')}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="UZS">UZS</option>
                </select>
              </div>
            </Field>

            <Field label="Jo‘nash sanasi" hint="Kartochkada va filtrda ko‘rsatiladi">
              <input
                type="date"
                value={form.departureDate}
                onChange={(e) => set('departureDate', e.target.value)}
                className={inputStyles}
              />
            </Field>
          </FieldRow>

          <Field
            label={`Qisqa tavsif (${lang.toUpperCase()})`}
            hint="Kartochkada va Google natijalarida ko‘rinadi. 1–2 jumla."
          >
            <textarea
              value={bilingual('summary')}
              onChange={(e) => setBilingual('summary', e.target.value)}
              rows={2}
              maxLength={500}
              className={cn(inputStyles, 'resize-y')}
            />
          </Field>

          <div className="flex flex-wrap gap-5 border-t border-line pt-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isHot}
                onChange={(e) => set('isHot', e.target.checked)}
                className="size-4 accent-[#C8102E]"
              />
              🔥 Goryashiy tur
              <span className="text-xs text-ink-subtle">(qizil beja bilan ajratiladi)</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set('isFeatured', e.target.checked)}
                className="size-4 accent-[#D4AF37]"
              />
              ⭐ Bosh sahifada ko‘rsatish
            </label>
          </div>
        </FormSection>

        {/* ── 2. TAFSILOTLAR ── */}
        <FormSection
          title="Tafsilotlar"
          hint="Davomiylik, mehmonxona, ovqatlanish — tur sahifasidagi ma’lumot kartochkalari."
          badge={badges.details}
        >
          <FieldRow>
            <Field label="Kunlar">
              <input
                type="number"
                min={1}
                max={60}
                value={form.durationDays}
                onChange={(e) => set('durationDays', e.target.value)}
                placeholder="7"
                className={inputStyles}
              />
            </Field>
            <Field label="Kechalar">
              <input
                type="number"
                min={0}
                max={60}
                value={form.durationNights}
                onChange={(e) => set('durationNights', e.target.value)}
                placeholder="6"
                className={inputStyles}
              />
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Mehmonxona">
              <select
                value={form.hotelStars}
                onChange={(e) => set('hotelStars', e.target.value)}
                className={inputStyles}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}★
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Ovqatlanish">
              <select
                value={form.mealPlan}
                onChange={(e) => set('mealPlan', e.target.value as MealPlan | '')}
                className={inputStyles}
              >
                <option value="">—</option>
                {MEAL_PLANS.map((plan) => (
                  <option key={plan} value={plan}>
                    {plan} — {MEAL_PLAN_LABELS[plan].uz}
                  </option>
                ))}
              </select>
            </Field>
          </FieldRow>

          <FieldRow>
            <Field label="Qo‘shimcha to‘lov" hint="Posterlardagi «qo‘shimcha to‘lov» summasi">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.extraFee}
                onChange={(e) => set('extraFee', e.target.value)}
                placeholder="250"
                className={inputStyles}
              />
            </Field>

            <Field
              label="Qolgan joylar"
              hint="5 va undan kam bo‘lsa saytda ogohlantirish chiqadi"
            >
              <input
                type="number"
                min={0}
                max={999}
                value={form.seatsLeft}
                onChange={(e) => set('seatsLeft', e.target.value)}
                placeholder="12"
                className={inputStyles}
              />
            </Field>
          </FieldRow>

          <Field label="Qaytish sanasi">
            <input
              type="date"
              value={form.returnDate}
              onChange={(e) => set('returnDate', e.target.value)}
              className={cn(inputStyles, 'sm:max-w-xs')}
            />
          </Field>
        </FormSection>

        {/* ── 3. TARKIB ── */}
        <FormSection
          title="Marshrut va tarkib"
          hint="Shaharlar va narxga nima kirishi. Tur sahifasida ro‘yxat bo‘lib chiqadi."
          badge={badges.content}
        >
          {lang === 'uz' ? (
            <ListEditor
              label="Shaharlar (UZ)"
              values={citiesUz}
              onChange={(v) => {
                setCitiesUz(v);
                setDirty(true);
              }}
              placeholder="Istanbul"
              hint="Yozib Enter bosing yoki + tugmasini bosing"
            />
          ) : (
            <ListEditor
              label="Shaharlar (RU)"
              values={citiesRu}
              onChange={(v) => {
                setCitiesRu(v);
                setDirty(true);
              }}
              placeholder="Стамбул"
            />
          )}

          <ListEditor
            label="Narxga kiradi"
            values={includes}
            onChange={(v) => {
              setIncludes(v);
              setDirty(true);
            }}
            placeholder="Aviachipta (borish-kelish)"
          />

          <ListEditor
            label="Narxga kirmaydi"
            values={excludes}
            onChange={(v) => {
              setExcludes(v);
              setDirty(true);
            }}
            placeholder="Ekskursiyalar"
          />

          <Field
            label={`Dastur / batafsil matn (${lang.toUpperCase()})`}
            hint="HTML qo‘llab-quvvatlanadi: <h2>, <p>, <ul>, <li>, <strong>, <a href=…>"
          >
            <textarea
              value={bilingual('body')}
              onChange={(e) => setBilingual('body', e.target.value)}
              rows={10}
              className={cn(inputStyles, 'resize-y font-mono text-xs')}
              placeholder="<h2>1-kun</h2><p>Toshkentdan uchish...</p>"
            />
          </Field>
        </FormSection>

        {/* ── 4. GALEREYA ── */}
        <FormSection
          title="Galereya"
          hint="Qo‘shimcha rasmlar — tur sahifasining pastida ko‘rsatiladi."
          badge={badges.gallery}
        >
          <div className="flex flex-wrap gap-2">
            {gallery.map((media) => (
              <div
                key={media.id}
                className="relative size-20 overflow-hidden rounded-lg border border-line-strong"
              >
                <Image
                  src={media.variants.thumb?.webp ?? media.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setGallery((prev) => prev.filter((m) => m.id !== media.id));
                    setDirty(true);
                  }}
                  aria-label="Olib tashlash"
                  className="absolute top-1 right-1 rounded-full bg-navy-950/80 p-1 text-white transition-colors hover:bg-hot-500"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setPicker('gallery')}
              className="flex size-20 items-center justify-center rounded-lg border-2 border-dashed border-line-strong text-ink-subtle transition-colors hover:border-gold-500 hover:text-accent"
              aria-label="Galereyaga rasm qo‘shish"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </FormSection>

        {/* ── 5. SEO ── */}
        <FormSection
          title="SEO va manzil"
          hint="Bo‘sh qoldirsangiz, sarlavha va qisqa tavsifdan avtomatik olinadi."
          badge={badges.seo}
        >
          <Field
            label="Sahifa manzili (slug)"
            hint={`Sayt manzili: /uz/turlar/${form.slug || 'avtomatik'}`}
            error={fieldError('slug')}
          >
            <input
              value={form.slug}
              onChange={(e) => set('slug', slugify(e.target.value))}
              placeholder="turkiya-mojizalari"
              className={inputStyles}
            />
          </Field>

          <Field
            label={`SEO sarlavha (${lang.toUpperCase()})`}
            hint="60–70 belgi ideal. Kompaniya nomi avtomatik qo‘shiladi — yozish shart emas."
          >
            <input
              value={bilingual('seoTitle')}
              onChange={(e) => setBilingual('seoTitle', e.target.value)}
              maxLength={180}
              className={inputStyles}
            />
          </Field>

          <Field label={`SEO tavsif (${lang.toUpperCase()})`} hint="150–160 belgi ideal">
            <textarea
              value={bilingual('seoDescription')}
              onChange={(e) => setBilingual('seoDescription', e.target.value)}
              rows={2}
              maxLength={400}
              className={cn(inputStyles, 'resize-y')}
            />
          </Field>
        </FormSection>
      </FormShell>

      <MediaPicker
        open={picker !== null}
        multiple={picker === 'gallery'}
        onClose={() => setPicker(null)}
        onSelect={(media) => {
          setDirty(true);
          if (picker === 'poster') {
            setPoster(media[0] ?? null);
          } else {
            setGallery((prev) => {
              // Bir xil rasm ikki marta qo'shilmasin.
              const existing = new Set(prev.map((m) => m.id));
              return [...prev, ...media.filter((m) => !existing.has(m.id))];
            });
          }
        }}
      />
    </>
  );
}
