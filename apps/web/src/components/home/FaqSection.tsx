'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { FaqDTO, Locale } from '@ayntravel/shared';
import { pick } from '@ayntravel/shared';

/**
 * Savol-javob akkordeoni.
 *
 * Bu blok ikki marta ish bajaradi: foydalanuvchiga javob beradi va
 * sahifaga `FAQPage` strukturalangan ma'lumotini beradi (JSON-LD sahifa
 * darajasida qo'shiladi) — Google natijalarda savollarni ochib ko'rsatishi mumkin.
 */
export function FaqSection({ faqs, locale }: { faqs: FaqDTO[]; locale: Locale }) {
  return (
    <Accordion.Root type="single" collapsible className="mx-auto flex max-w-3xl flex-col gap-3">
      {faqs.map((faq) => {
        const record = faq as unknown as Record<string, unknown>;
        return (
          <Accordion.Item
            key={faq.id}
            value={faq.id}
            className="card-surface overflow-hidden data-[state=open]:border-gold-500/30"
          >
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink transition-colors hover:text-accent">
                <span>{pick(record, 'question', locale)}</span>
                <ChevronDown
                  className="size-5 shrink-0 text-accent transition-transform duration-300 group-data-[state=open]:rotate-180"
                  aria-hidden="true"
                />
              </Accordion.Trigger>
            </Accordion.Header>

            {/* Radix balandlikni CSS o'zgaruvchisiga yozadi — shu bilan
                animatsiya `height: auto` muammosisiz silliq ishlaydi. */}
            <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[acc-up_250ms_ease] data-[state=open]:animate-[acc-down_250ms_ease]">
              <div className="px-5 pb-5 text-sm leading-relaxed text-ink-muted">
                {pick(record, 'answer', locale)}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
}
