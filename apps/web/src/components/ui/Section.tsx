import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion/Reveal';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Konteynersiz — kontent butun kenglikni egallashi kerak bo'lganda (rail). */
  bleed?: boolean;
  /**
   * `dark` — bo'lim to'q fonda chiziladi va ichidagi semantik ranglar
   * (matn, chegara) avtomatik teskarisiga o'tadi.
   */
  tone?: 'dark';
}

/**
 * Bo'lim o'ramchisi. Vertikal bo'sh joy ataylab katta: editorial
 * uslubda kontentga «nafas» kerak, siqilgan bloklar arzon ko'rinadi.
 */
export function Section({ children, className, id, bleed = false, tone }: SectionProps) {
  return (
    <section
      id={id}
      data-tone={tone}
      className={cn('py-20 sm:py-24 lg:py-32', className)}
    >
      {bleed ? children : <div className="container-page">{children}</div>}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Sarlavha ustidagi kichik yorliq: "GORYASHIY TAKLIFLAR" */
  eyebrow?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  align = 'left',
  action,
  className,
}: SectionHeaderProps) {
  return (
    <Reveal
      className={cn(
        'mb-12 flex flex-col gap-5 sm:mb-16',
        align === 'center'
          ? 'items-center text-center'
          : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <span className="eyebrow mb-3 block">{eyebrow}</span>
        ) : (
          /* Oltin chiziqcha — posterlardagi ajratkichlar uslubida */
          <div
            className={cn(
              'mb-5 h-px w-16 bg-gradient-to-r from-gold-500 to-transparent',
              align === 'center' &&
                'mx-auto w-24 bg-gradient-to-r from-transparent via-gold-500 to-transparent',
            )}
          />
        )}

        <h2 className="type-h2">{title}</h2>
        {subtitle && <p className="type-lead mt-4">{subtitle}</p>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
