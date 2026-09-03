import { Quote, Star } from 'lucide-react';
import type { Locale, TestimonialDTO } from '@/shared';
import { pick } from '@/shared';
import { SmartImage } from '@/components/ui/SmartImage';
import { Marquee } from '@/components/motion/Marquee';
import { Spotlight } from '@/components/motion/Spotlight';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

interface Props {
  testimonials: TestimonialDTO[];
  locale: Locale;
}

function TestimonialCard({
  testimonial,
  locale,
}: {
  testimonial: TestimonialDTO;
  locale: Locale;
}) {
  return (
    <Spotlight className="h-full rounded-card">
      <figure className="card-surface flex h-full flex-col p-6 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-card-hover">
        <Quote
          className="mb-3 size-7 text-accent/40 transition-colors duration-300 group-hover/spot:text-accent/70"
          aria-hidden="true"
        />

        <blockquote className="flex-1 text-sm leading-relaxed text-ink-muted">
          {pick(testimonial as unknown as Record<string, unknown>, 'text', locale)}
        </blockquote>

        <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-ink/10">
            {testimonial.photo ? (
              <SmartImage
                media={testimonial.photo}
                variant="thumb"
                alt={testimonial.clientName}
                locale={locale}
                sizes="40px"
              />
            ) : (
              <span className="flex size-full items-center justify-center font-display font-bold text-accent">
                {testimonial.clientName.charAt(0)}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{testimonial.clientName}</p>
            <div className="flex gap-0.5" aria-label={`${testimonial.rating} / 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < testimonial.rating
                      ? 'size-3 fill-gold-300 text-accent'
                      : 'size-3 text-ink/20'
                  }
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </figcaption>
      </figure>
    </Spotlight>
  );
}

/**
 * Mijozlar fikri.
 *
 * Ikki qator qarama-qarshi yo'nalishda sekin suriladi — statik griddan
 * farqli o'laroq blok "tirik" ko'rinadi va ko'proq fikr sig'adi. Hover yoki
 * klaviatura fokusida tasma to'xtaydi, ya'ni matnni bemalol o'qish mumkin.
 *
 * 4 tadan kam fikr bo'lsa tasma mantiqsiz — oddiy grid chiziladi.
 * Mobilda ham grid: kichik ekranda aylanuvchi matn o'qishga xalaqit beradi.
 */
export function TestimonialsSection({ testimonials, locale }: Props) {
  if (testimonials.length === 0) return null;

  if (testimonials.length < 4) {
    return (
      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <RevealItem key={testimonial.id}>
            <TestimonialCard testimonial={testimonial} locale={locale} />
          </RevealItem>
        ))}
      </RevealGroup>
    );
  }

  const half = Math.ceil(testimonials.length / 2);

  /*
   * Har bir qatorda kamida 4 ta kartochka bo'lishi SHART.
   *
   * Tasma bitta nusxani -50% ga suradi; agar nusxa ekran kengligidan tor
   * bo'lsa, siljish oxirida o'ng tomonda bo'sh joy ochilib qoladi. 4 ta
   * kartochka (~4×23rem) eng keng konteynerni ham qoplaydi.
   */
  const fill = (items: TestimonialDTO[]) => {
    if (items.length === 0) return items;
    const out = [...items];
    while (out.length < 4) out.push(...items);
    return out;
  };

  const rows = [fill(testimonials.slice(0, half)), fill(testimonials.slice(half))];

  return (
    <>
      {/* Mobil: oddiy grid — aylanuvchi matn kichik ekranda bezovta qiladi */}
      <RevealGroup className="grid gap-5 sm:hidden">
        {testimonials.slice(0, 4).map((testimonial) => (
          <RevealItem key={testimonial.id}>
            <TestimonialCard testimonial={testimonial} locale={locale} />
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Desktop: ikki qatorli tasma. `bleed` bo'lmagani uchun chetlarga chiqamiz */}
      <div className="relative -mx-4 hidden flex-col gap-5 sm:flex sm:-mx-6 lg:-mx-8">
        {rows.map((row, rowIndex) => (
          <Marquee
            key={rowIndex}
            // Har bir kartochka ~9 soniyada o'tadi — o'qishga ulguriladi.
            durationSeconds={row.length * 9}
            direction={rowIndex === 0 ? 'left' : 'right'}
            itemsClassName="gap-5 pr-5"
          >
            {row.map((testimonial, index) => (
              // Kartochkalar takrorlanishi mumkin, shuning uchun kalitda indeks ham bor
              <div key={`${testimonial.id}-${index}`} className="w-[22rem] shrink-0">
                <TestimonialCard testimonial={testimonial} locale={locale} />
              </div>
            ))}
          </Marquee>
        ))}

        {/* Chetlardagi so'nish */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-surface to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface to-transparent"
        />
      </div>
    </>
  );
}
