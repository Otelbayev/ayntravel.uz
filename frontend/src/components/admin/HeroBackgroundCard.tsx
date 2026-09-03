'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import type { HeroBackgroundConfig, MediaDTO, ResolvedHeroBackground } from '@/shared';
import {
  HERO_MAX_INTERVAL_MS,
  HERO_MAX_SLIDES,
  HERO_MIN_INTERVAL_MS,
} from '@/shared';
import { Card, Field, inputStyles } from './ui';
import { MediaField, MediaPicker } from './MediaPicker';
import { MediaThumb } from './MediaThumb';
import { cn } from '@/lib/utils';

interface Props {
  value: HeroBackgroundConfig;
  /** Birinchi yuklashda thumbnail'larni to'ldirish uchun — serverdan keladi. */
  resolved: ResolvedHeroBackground | undefined;
  onChange: (next: HeroBackgroundConfig) => void;
}

const MODES = [
  {
    value: 'gradient' as const,
    title: 'Gradient',
    hint: 'Hozirgidek — sof rang o‘tishi. Eng tez ochiladi.',
  },
  {
    value: 'slideshow' as const,
    title: 'Slayd-shou',
    hint: 'Bir nechta rasm navbat bilan almashadi.',
  },
  {
    value: 'video' as const,
    title: 'Video',
    hint: 'Fon videosi tovushsiz aylanib turadi.',
  },
];

const VIDEO_URL_RE = /^https?:\/\/.+\.(mp4|webm)(\?.*)?$/i;

/**
 * Bosh ekran foni sozlamalari.
 *
 * Nega generik `Group` maydon turi emas: shu sahifada aynan shunday pretsedent
 * bor — statistika kartochkasi ham `GROUPS` dan tashqarida. Bitta kompozit
 * muharrir uchun maydon-turi plagin tizimi ortiqcha bo'lardi.
 */
export function HeroBackgroundCard({ value, resolved, onChange }: Props) {
  // Server faqat birinchi yuklashda to'liq obyektlarni beradi; keyingi
  // o'zgarishlarni `MediaPicker` ning o'zi `MediaDTO` bilan qaytaradi.
  const [slides, setSlides] = useState<MediaDTO[]>(resolved?.slides ?? []);
  const [videoMedia, setVideoMedia] = useState<MediaDTO | null>(resolved?.videoMedia ?? null);
  const [poster, setPoster] = useState<MediaDTO | null>(resolved?.poster ?? null);
  const [picker, setPicker] = useState<'slides' | 'video' | 'poster' | null>(null);

  const patch = (next: Partial<HeroBackgroundConfig>) => onChange({ ...value, ...next });

  function applySlides(next: MediaDTO[]) {
    setSlides(next);
    patch({ slideIds: next.map((m) => m.id) });
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target]!, next[index]!];
    applySlides(next);
  }

  const urlInvalid = value.videoUrl !== '' && !VIDEO_URL_RE.test(value.videoUrl);
  const posterMissing = value.mode === 'video' && !poster;
  const previewSlide = slides[0] ?? poster;

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="font-display font-bold text-ink">Bosh ekran foni</h2>
        <p className="mt-1 text-xs text-ink-subtle">
          Sarlavha va tavsif barcha slaydlarda bir xil qoladi — faqat fon almashadi.
        </p>
      </div>

      {/* ── Rejim ── */}
      <div className="grid gap-2 sm:grid-cols-3">
        {MODES.map((mode) => {
          const active = value.mode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => patch({ mode: mode.value })}
              aria-pressed={active}
              className={cn(
                'rounded-xl border-2 p-3 text-left transition-colors',
                active
                  ? 'border-gold-500 bg-gold-500/5'
                  : 'border-line hover:border-line-strong',
              )}
            >
              <span className="block text-sm font-semibold text-ink">{mode.title}</span>
              <span className="mt-0.5 block text-xs text-ink-subtle">{mode.hint}</span>
            </button>
          );
        })}
      </div>

      {/* ── Slaydlar ── */}
      {value.mode === 'slideshow' && (
        <Field
          label="Slaydlar"
          hint={`Ko‘pi bilan ${HERO_MAX_SLIDES} ta rasm. Tartibni o‘qlar bilan o‘zgartiring — birinchisi darhol ko‘rinadi.`}
        >
          <div className="flex flex-wrap gap-2">
            {slides.map((media, index) => (
              <div
                key={media.id}
                className="relative aspect-video w-32 overflow-hidden rounded-lg border border-line-strong"
              >
                <MediaThumb media={media} sizes="128px" />

                <button
                  type="button"
                  onClick={() => applySlides(slides.filter((m) => m.id !== media.id))}
                  aria-label={`${index + 1}-slaydni olib tashlash`}
                  className="absolute top-1 right-1 rounded-full bg-navy-950/80 p-1 text-white transition-colors hover:bg-hot-500"
                >
                  <X className="size-3" />
                </button>

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-navy-950/80 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Chapga surish"
                    className="rounded p-0.5 text-white disabled:opacity-30 hover:text-gold-300"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-gold-300">{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === slides.length - 1}
                    aria-label="O‘ngga surish"
                    className="rounded p-0.5 text-white disabled:opacity-30 hover:text-gold-300"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {slides.length < HERO_MAX_SLIDES && (
              <button
                type="button"
                onClick={() => setPicker('slides')}
                aria-label="Slayd qo‘shish"
                className="flex aspect-video w-32 items-center justify-center rounded-lg border-2 border-dashed border-line-strong text-ink-subtle transition-colors hover:border-gold-500 hover:text-accent"
              >
                <Plus className="size-5" />
              </button>
            )}
          </div>
        </Field>
      )}

      {/* ── Video ── */}
      {value.mode === 'video' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(
              [
                ['upload', 'Yuklangan fayl'],
                ['url', 'Tashqi havola'],
              ] as const
            ).map(([source, label]) => (
              <button
                key={source}
                type="button"
                onClick={() => patch({ videoSource: source })}
                aria-pressed={value.videoSource === source}
                className={cn(
                  'rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors',
                  value.videoSource === source
                    ? 'border-gold-500 bg-gold-500/10 text-accent'
                    : 'border-line text-ink-muted hover:border-line-strong',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {value.videoSource === 'url' ? (
            <Field
              label="Video havolasi"
              hint="To‘g‘ridan-to‘g‘ri .mp4 yoki .webm fayl manzili. YouTube havolasi ishlamaydi."
            >
              <input
                value={value.videoUrl}
                onChange={(e) => patch({ videoUrl: e.target.value })}
                placeholder="https://cdn.example.com/hero.mp4"
                className={cn(inputStyles, urlInvalid && 'border-hot-500')}
              />
              {urlInvalid && (
                <p className="mt-1 text-xs text-hot-500">
                  Havola .mp4 yoki .webm bilan tugashi kerak
                </p>
              )}
            </Field>
          ) : (
            <MediaField
              media={videoMedia}
              kind="video"
              width="w-56"
              aspect="aspect-video"
              label="Fon videosi"
              onPick={() => setPicker('video')}
              onClear={() => {
                setVideoMedia(null);
                patch({ videoMediaId: null });
              }}
            />
          )}

          <div>
            <MediaField
              media={poster}
              width="w-56"
              aspect="aspect-video"
              label="Video posteri (majburiy)"
              onPick={() => setPicker('poster')}
              onClear={() => {
                setPoster(null);
                patch({ videoPosterId: null });
              }}
            />
            <p className="mt-1.5 text-xs text-ink-subtle">
              Video yuklanguncha va telefonlarda shu rasm ko‘rinadi. Sahifa tezligi
              aynan shu rasm bo‘yicha o‘lchanadi.
            </p>
            {posterMissing && (
              <p className="mt-1 text-xs text-hot-500">
                Postersiz video rejimi ishlamaydi — sayt gradientga qaytadi.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Umumiy sozlamalar ── */}
      {value.mode !== 'gradient' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {value.mode === 'slideshow' && (
            <>
              <Field label="Slayd davomiyligi (soniya)">
                <input
                  type="number"
                  min={HERO_MIN_INTERVAL_MS / 1000}
                  max={HERO_MAX_INTERVAL_MS / 1000}
                  value={Math.round(value.intervalMs / 1000)}
                  onChange={(e) => {
                    const sec = Number(e.target.value) || HERO_MIN_INTERVAL_MS / 1000;
                    const clamped = Math.min(
                      HERO_MAX_INTERVAL_MS / 1000,
                      Math.max(HERO_MIN_INTERVAL_MS / 1000, sec),
                    );
                    patch({ intervalMs: clamped * 1000 });
                  }}
                  className={inputStyles}
                />
              </Field>

              <Field label="Sekin yaqinlashish (ken burns)">
                <label className="flex items-center gap-2 text-sm text-ink-muted">
                  <input
                    type="checkbox"
                    checked={value.kenBurns}
                    onChange={(e) => patch({ kenBurns: e.target.checked })}
                    className="size-4 accent-gold-500"
                  />
                  Rasm sekin kattalashib boradi
                </label>
                <p className="mt-1 text-xs text-ink-subtle">
                  Harakatni kamaytirish yoqilgan foydalanuvchilarda avtomatik o‘chadi.
                </p>
              </Field>
            </>
          )}

          <div className="sm:col-span-2">
            <Field
              label={`Parda quyuqligi — ${Math.round(value.overlayOpacity * 100)}%`}
              hint="Matn o‘qilishi uchun fon ustidagi qora parda. Pastdagi ko‘rinishda tekshiring."
            >
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={value.overlayOpacity}
                onChange={(e) => patch({ overlayOpacity: Number(e.target.value) })}
                className="w-full accent-gold-500"
              />
            </Field>

            {/* Jonli ko'rinish — menejer saqlashdan oldin kontrastni ko'radi. */}
            <div
              data-tone="dark"
              className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-line bg-navy-950"
            >
              {previewSlide && <MediaThumb media={previewSlide} sizes="600px" />}
              <div
                className="absolute inset-0 bg-navy-950"
                style={{ opacity: value.overlayOpacity }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-navy-950/40 to-navy-950/90" />
              <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 p-6">
                <span className="eyebrow">Toshkentdagi turizm kompaniyasi</span>
                <span className="font-display text-2xl font-extrabold text-ink sm:text-4xl">
                  Sayohatingizni biz bilan boshlang
                </span>
                <span className="text-sm text-ink-muted">
                  Turlar • Aviachiptalar • Mehmonxonalar • Viza yordami
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <MediaPicker
        open={picker !== null}
        kind={picker === 'video' ? 'video' : 'image'}
        multiple={picker === 'slides'}
        onClose={() => setPicker(null)}
        onSelect={(chosen) => {
          if (picker === 'slides') {
            const seen = new Set(slides.map((m) => m.id));
            const added = chosen.filter((m) => !seen.has(m.id));
            applySlides([...slides, ...added].slice(0, HERO_MAX_SLIDES));
          } else if (picker === 'video') {
            const media = chosen[0] ?? null;
            setVideoMedia(media);
            patch({ videoMediaId: media?.id ?? null });
          } else if (picker === 'poster') {
            const media = chosen[0] ?? null;
            setPoster(media);
            patch({ videoPosterId: media?.id ?? null });
          }
          setPicker(null);
        }}
      />
    </Card>
  );
}
