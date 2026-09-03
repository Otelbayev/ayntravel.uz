import {
  Plane, Ticket, Hotel, BookUser, Bus, Briefcase, Sparkles, type LucideIcon,
} from 'lucide-react';
import type { Locale, ServiceDTO } from '@/shared';
import { pick } from '@/shared';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { Spotlight } from '@/components/motion/Spotlight';

/** Bazadagi `icon` satri shu jadval orqali komponentga aylantiriladi. */
const ICONS: Record<string, LucideIcon> = {
  plane: Plane,
  ticket: Ticket,
  hotel: Hotel,
  passport: BookUser,
  bus: Bus,
  briefcase: Briefcase,
};

export function ServicesSection({
  services,
  locale,
}: {
  services: ServiceDTO[];
  locale: Locale;
}) {
  return (
    <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
      {services.map((service, index) => {
        const Icon = ICONS[service.icon ?? ''] ?? Sparkles;
        const record = service as unknown as Record<string, unknown>;
        return (
          <RevealItem key={service.id}>
            <Spotlight className="h-full rounded-card">
              <article className="card-surface group relative h-full overflow-hidden p-6 transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-gold-500/40 hover:shadow-card-hover">
                {/* Fondagi katta tartib raqami — editorial his beradi */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-4 -right-2 font-display text-8xl font-extrabold tabular-nums text-ink/[0.035] transition-colors duration-500 group-hover:text-gold-500/10"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="relative mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gold-500/10 text-accent transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-6 group-hover:scale-110 group-hover:bg-gold-500 group-hover:text-navy-950 group-hover:[animation:pulse-gold_2.5s_ease-out_infinite]">
                  <Icon className="size-6" aria-hidden="true" />
                </span>

                <h3 className="relative font-display text-xl font-bold text-ink">
                  {pick(record, 'title', locale)}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-ink-muted">
                  {pick(record, 'description', locale)}
                </p>
              </article>
            </Spotlight>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
