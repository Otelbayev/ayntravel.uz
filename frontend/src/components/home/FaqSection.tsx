'use client';

import * as Accordion from '@radix-ui/react-accordion';
import type { FaqDTO, Locale } from '@/shared';
import { pick } from '@/shared';
import { RevealGroup, RevealItem } from '@/components/motion/Reveal';

/**
 * Savol-javob akkordeoni.
 *
 * Bu blok ikki marta ish bajaradi: foydalanuvchiga javob beradi va
 * sahifaga `FAQPage` strukturalangan ma'lumotini beradi (JSON-LD sahifa
 * darajasida qo'shiladi) — Google natijalarda savollarni ochib ko'rsatishi mumkin.
 */
export function FaqSection({ faqs, locale }: { faqs: FaqDTO[]; locale: Locale }) {
  return (
    /*
     * `RevealGroup` tashqarida, `Accordion.Root` ichida: Motion variantlari
     * React konteksti orqali tarqaladi, ya'ni oradagi Radix `div` xalaqit
     * bermaydi. `asChild` bu yerda ishlamaydi — `RevealGroup` ref uzatmaydi.
     */
    <RevealGroup className="mx-auto max-w-3xl" stagger={0.06}>
      <Accordion.Root type="single" collapsible className="flex flex-col gap-3">
        {faqs.map((faq, index) => {
          const record = faq as unknown as Record<string, unknown>;
          return (
            <RevealItem key={faq.id}>
              <Accordion.Item
                value={faq.id}
                className="card-surface group/item relative overflow-hidden transition-[border-color,box-shadow] duration-300 data-[state=open]:border-gold-500/40 data-[state=open]:shadow-card-hover"
              >
                {/* Ochiq savolda chap tomonda oltin chiziq o'sib chiqadi */}
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-gradient-to-b from-gold-300 to-gold-500 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[state=open]/item:scale-y-100"
                />
                {/* Ochilganda juda yumshoq oltin nur */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold-500/[0.07] to-transparent opacity-0 transition-opacity duration-300 group-data-[state=open]/item:opacity-100"
                />

                <Accordion.Header>
                  <Accordion.Trigger className="group relative flex w-full items-center gap-4 px-5 py-4 text-left font-semibold text-ink transition-colors hover:text-accent">
                    <span
                      aria-hidden="true"
                      className="font-display text-sm font-extrabold tabular-nums text-accent/30 transition-colors duration-300 group-data-[state=open]:text-accent"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="flex-1">{pick(record, 'question', locale)}</span>

                    {/* «+» → «×»: ikkita chiziqcha, biri aylanadi */}
                    <span
                      aria-hidden="true"
                      className="relative size-5 shrink-0 text-accent transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-data-[state=open]:rotate-45"
                    >
                      <span className="absolute top-1/2 left-0 h-0.5 w-5 -translate-y-1/2 rounded-full bg-current" />
                      <span className="absolute top-0 left-1/2 h-5 w-0.5 -translate-x-1/2 rounded-full bg-current" />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>

                {/* Radix balandlikni CSS o'zgaruvchisiga yozadi — shu bilan
                    animatsiya `height: auto` muammosisiz silliq ishlaydi. */}
                <Accordion.Content className="relative overflow-hidden data-[state=closed]:animate-[acc-up_250ms_ease] data-[state=open]:animate-[acc-down_280ms_ease]">
                  <div className="px-5 pb-5 pl-13 text-sm leading-relaxed text-ink-muted">
                    {pick(record, 'answer', locale)}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            </RevealItem>
          );
        })}
      </Accordion.Root>
    </RevealGroup>
  );
}
