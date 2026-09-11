import { useTranslations } from 'next-intl';
import { Clock, Instagram, MapPin, Phone, Send } from 'lucide-react';
import type { Locale, SiteSettings } from '@/shared';
import { displayPhone } from '@/lib/format';
import { LeadForm } from '@/components/forms/LeadForm';
import { Reveal } from '@/components/motion/Reveal';

interface Props {
  settings: SiteSettings;
  locale: Locale;
  initialMessage?: string;
}

/**
 * Aloqa bloki: chapda kontaktlar va xarita, o'ngda ariza formasi.
 *
 * Xarita `iframe` sifatida emas, tashqi link sifatida beriladi — Yandex
 * iframe'i og'ir va sahifa tezligini pasaytiradi. Foydalanuvchi baribir
 * telefonidagi xarita ilovasida ochishni afzal ko'radi.
 */
export function ContactSection({ settings, locale, initialMessage }: Props) {
  const t = useTranslations('contact');

  const address = locale === 'ru' ? settings.addressRu : settings.addressUz;
  const hours = locale === 'ru' ? settings.workingHoursRu : settings.workingHoursUz;

  const items = [
    {
      icon: Phone,
      label: t('phone'),
      lines: [
        { text: displayPhone(settings.phonePrimary), href: `tel:${settings.phonePrimary}` },
        { text: displayPhone(settings.phoneSecondary), href: `tel:${settings.phoneSecondary}` },
      ],
    },
    {
      icon: Send,
      label: t('telegram'),
      lines: [
        { text: '@ayn_travel', href: settings.telegramChannel },
        { text: '@ayntravel01', href: settings.telegramAdmin },
      ],
    },
    {
      icon: MapPin,
      label: t('address'),
      lines: [{ text: address, href: settings.mapUrl }],
    },
    {
      icon: Clock,
      label: t('workingHours'),
      lines: [{ text: hours, href: null }],
    },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <Reveal direction="right">
        <div className="flex flex-col gap-6">
          {items.map((item) => (
            <div key={item.label} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-accent">
                <item.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">
                  {item.label}
                </p>
                {item.lines.map((line) =>
                  line.href ? (
                    <a
                      key={line.text}
                      href={line.href}
                      target={line.href.startsWith('http') ? '_blank' : undefined}
                      rel={line.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="block text-ink transition-colors hover:text-accent"
                    >
                      {line.text}
                    </a>
                  ) : (
                    <p key={line.text} className="text-ink">
                      {line.text}
                    </p>
                  ),
                )}
              </div>
            </div>
          ))}

          <a
            href={settings.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2.5 self-start rounded-xl border border-line-strong px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-gold-500/50 hover:text-accent"
          >
            <Instagram className="size-5" aria-hidden="true" />
            @ayntravel.uz
          </a>

          <a
            href={settings.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block h-48 overflow-hidden rounded-card border border-line bg-surface-raised sm:h-56"
          >
            {/* Yengil xarita o'rnini bosuvchi: og'ir iframe o'rniga statik blok */}
            <div data-tone="dark" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy-700 to-navy-950 transition-colors group-hover:from-navy-600">
              <MapPin className="size-8 text-accent" aria-hidden="true" />
              <p className="px-4 text-center text-sm font-medium text-ink">{address}</p>
              <span className="text-xs font-semibold text-accent">{t('openMap')} →</span>
            </div>
          </a>
        </div>
      </Reveal>

      <Reveal direction="left">
        <div className="card-surface p-6 sm:p-8">
          <LeadForm initialMessage={initialMessage} source="contact_page" phone={settings.phonePrimary} />
        </div>
      </Reveal>
    </div>
  );
}
