import {
  Plane, Ticket, Hotel, BookUser, Bus, Briefcase, Sparkles, type LucideIcon,
} from 'lucide-react';
import type { Locale, ServiceDTO } from '@ayntravel/shared';
import { pick } from '@ayntravel/shared';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

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
    <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const Icon = ICONS[service.icon ?? ''] ?? Sparkles;
        const record = service as unknown as Record<string, unknown>;
        return (
          <RevealItem key={service.id}>
            <article className="card-surface group h-full p-6 transition-colors hover:border-gold-500/30">
              <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gold-500/10 text-accent transition-colors group-hover:bg-gold-500 group-hover:text-navy-950">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="font-display text-xl font-bold text-ink">
                {pick(record, 'title', locale)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {pick(record, 'description', locale)}
              </p>
            </article>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
