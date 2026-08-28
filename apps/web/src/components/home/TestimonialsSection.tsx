import { Quote, Star } from 'lucide-react';
import type { Locale, TestimonialDTO } from '@ayntravel/shared';
import { pick } from '@ayntravel/shared';
import { SmartImage } from '@/components/ui/SmartImage';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

export function TestimonialsSection({
  testimonials,
  locale,
}: {
  testimonials: TestimonialDTO[];
  locale: Locale;
}) {
  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial) => (
        <RevealItem key={testimonial.id}>
          <figure className="card-surface flex h-full flex-col p-6">
            <Quote className="mb-3 size-7 text-accent/40" aria-hidden="true" />

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
                <p className="truncate text-sm font-semibold text-ink">
                  {testimonial.clientName}
                </p>
                <div
                  className="flex gap-0.5"
                  aria-label={`${testimonial.rating} / 5`}
                >
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
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
