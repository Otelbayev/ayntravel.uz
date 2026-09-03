import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Instagram, Mail, MapPin, Phone, Send, Clock } from 'lucide-react';
import type { Locale, SiteSettings } from '@/shared';
import { pick } from '@/shared';
import { Link } from '@/i18n/routing';
import type { DestinationNavItem } from '@/lib/api';
import { displayPhone } from '@/lib/format';

interface FooterProps {
  settings: SiteSettings;
  /** Faqat nom va slug — footerga hero rasmi va narx agregatsiyasi kerak emas. */
  destinations: DestinationNavItem[];
  locale: Locale;
}

const NAV = [
  { href: '/turlar', key: 'tours' },
  { href: '/yonalishlar', key: 'destinations' },
  { href: '/xizmatlar', key: 'services' },
  { href: '/blog', key: 'blog' },
  { href: '/biz-haqimizda', key: 'about' },
  { href: '/aloqa', key: 'contact' },
] as const;

export async function Footer({ settings, destinations, locale }: FooterProps) {
  const t = await getTranslations('footer');
  const tNav = await getTranslations('nav');
  const tContact = await getTranslations('contact');

  const address = locale === 'ru' ? settings.addressRu : settings.addressUz;
  const hours = locale === 'ru' ? settings.workingHoursRu : settings.workingHoursUz;

  return (
    <footer data-tone="dark" className="bg-navy-950">
      <div className="container-page py-14 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brend */}
          <div className="lg:pr-6">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Image
                src="/logo.jpg"
                alt=""
                width={44}
                height={44}
                className="size-10 rounded-full object-cover"
              />
              <span className="font-display text-xl leading-none font-black text-ink">
                AYN <span className="text-gold-gradient">TRAVEL</span>
              </span>
            </Link>
            <p className="mb-3 font-display text-sm font-semibold text-accent italic">
              {t('tagline')}
            </p>
            <p className="text-sm leading-relaxed text-ink-muted">{t('about')}</p>

            <div className="mt-5 flex gap-3">
              <a
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-lg border border-line-strong p-2.5 text-ink/70 transition-colors hover:border-gold-500/50 hover:text-accent"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href={settings.telegramChannel}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="rounded-lg border border-line-strong p-2.5 text-ink/70 transition-colors hover:border-gold-500/50 hover:text-accent"
              >
                <Send className="size-5" />
              </a>
            </div>
          </div>

          {/* Navigatsiya */}
          <nav aria-label={t('navigation')}>
            <h2 className="mb-4 font-display text-sm font-bold tracking-wider text-ink uppercase">
              {t('navigation')}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-ink-muted transition-colors hover:text-accent"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Ommabop yo'nalishlar — ichki linklar SEO uchun ham foydali */}
          <nav aria-label={t('popular')}>
            <h2 className="mb-4 font-display text-sm font-bold tracking-wider text-ink uppercase">
              {t('popular')}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {destinations.slice(0, 7).map((destination) => (
                <li key={destination.id}>
                  <Link
                    href={{
                      pathname: '/yonalishlar/[slug]',
                      params: { slug: destination.slug },
                    }}
                    className="text-sm text-ink-muted transition-colors hover:text-accent"
                  >
                    {pick(destination as unknown as Record<string, unknown>, 'name', locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Kontaktlar */}
          <div>
            <h2 className="mb-4 font-display text-sm font-bold tracking-wider text-ink uppercase">
              {t('contacts')}
            </h2>
            <ul className="flex flex-col gap-3.5 text-sm">
              <li>
                <a
                  href={`tel:${settings.phonePrimary}`}
                  className="flex items-start gap-2.5 text-ink-muted transition-colors hover:text-accent"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    {displayPhone(settings.phonePrimary)}
                    <br />
                    {displayPhone(settings.phoneSecondary)}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={settings.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 text-ink-muted transition-colors hover:text-accent"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{address}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-ink-muted">
                <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{hours}</span>
              </li>
              {settings.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-start gap-2.5 text-ink-muted transition-colors hover:text-accent"
                  >
                    <Mail className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span>{settings.email}</span>
                  </a>
                </li>
              )}
            </ul>

            <p className="mt-4 text-xs text-ink-subtle">{tContact('managers')}: Madina, Umid</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-7 sm:flex-row">
          <p className="text-xs text-ink-subtle">
            © {new Date().getFullYear()} AYN TRAVEL. {t('rights')}.
          </p>
          <div className="flex gap-5">
            <Link
              href="/ommaviy-oferta"
              className="text-xs text-ink-subtle transition-colors hover:text-accent"
            >
              {t('offer')}
            </Link>
            <Link
              href="/maxfiylik-siyosati"
              className="text-xs text-ink-subtle transition-colors hover:text-accent"
            >
              {t('privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
