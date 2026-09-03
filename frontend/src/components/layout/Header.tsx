'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Menu, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, usePathname } from '@/i18n/routing';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/utils';
import { displayPhone } from '@/lib/format';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/Button';

const NAV = [
  { href: '/turlar', key: 'tours' },
  { href: '/yonalishlar', key: 'destinations' },
  { href: '/xizmatlar', key: 'services' },
  { href: '/blog', key: 'blog' },
  { href: '/biz-haqimizda', key: 'about' },
  { href: '/aloqa', key: 'contact' },
] as const;

export function Header({ phone }: { phone: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  // Scroll holati — brauzer API'si, `useSyncExternalStore` aynan shu uchun.
  const scrolled = useScrolled(24);
  const [open, setOpen] = useState(false);

  // Scroll qilinganda shapka shaffofdan to'q fonga o'tadi —
  // hero rasmi ustida ham matn o'qiladigan bo'lib qoladi.
  /*
   * Menyu sahifa almashganda yopiladi. Effekt o'rniga bosish hodisasida
   * yopamiz — effekt ichidagi `setState` ortiqcha qayta renderga olib keladi.
   */

  // Menyu ochiqligida fon scroll qilinmasin.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Shapka ikki holatda ikki xil fonda turadi:
  //  • tepada — to'q hero ustida, shuning uchun matn oq bo'lishi kerak
  //  • scroll qilingach — oq sahifa ustida, matn navy bo'lishi kerak
  // `data-tone` shu tanlovni bitta joyda hal qiladi: ichidagi barcha
  // `text-ink`, `border-line` avtomatik moslashadi.
  const overHero = !scrolled && !open;

  return (
    <header
      data-tone={overHero ? 'dark' : undefined}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        overHero
          ? 'bg-gradient-to-b from-navy-950/85 to-transparent'
          : 'border-b border-line bg-surface/90 backdrop-blur-xl',
      )}
    >
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="AYN TRAVEL">
            <Image
              src="/logo.jpg"
              alt=""
              width={40}
              height={40}
              className="size-9 rounded-full object-cover lg:size-10"
              priority
            />
            <span className="font-display text-lg leading-none font-black tracking-tight text-ink lg:text-xl">
              AYN <span className="text-gold-gradient">TRAVEL</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t('menu')}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-accent'
                    : 'text-ink/80 hover:bg-ink/5 hover:text-ink',
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <Button asChild size="sm" className="hidden sm:inline-flex">
              <a href={`tel:${phone}`}>
                <Phone className="size-4" aria-hidden="true" />
                <span className="hidden md:inline">{displayPhone(phone)}</span>
                <span className="md:hidden">{t('contact')}</span>
              </a>
            </Button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 text-ink transition-colors hover:bg-ink/10 lg:hidden"
              aria-label={open ? t('close') : t('menu')}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line bg-surface lg:hidden"
            aria-label={t('menu')}
          >
            {/* Ichidagi istalgan havola bosilsa menyu yopiladi */}
            <div
              className="container-page flex flex-col gap-1 py-4"
              onClick={() => setOpen(false)}
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-base font-medium text-ink/90 transition-colors hover:bg-ink/5"
                >
                  {t(item.key)}
                </Link>
              ))}
              <a
                href={`tel:${phone}`}
                className="mt-2 flex items-center gap-2 rounded-lg bg-gold-500 px-3 py-3 font-bold text-navy-950"
              >
                <Phone className="size-4" aria-hidden="true" />
                {displayPhone(phone)}
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
