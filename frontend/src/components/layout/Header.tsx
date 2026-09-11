'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Menu, Phone, X } from 'lucide-react';
import { motion, useScroll } from 'motion/react';
import { Link, usePathname } from '@/i18n/routing';
import { useScrolled } from '@/hooks/useScrolled';
import { cn } from '@/lib/utils';
import { displayPhone } from '@/lib/format';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV = [
  { href: '/turlar', key: 'tours' }, { href: '/yonalishlar', key: 'destinations' },
  { href: '/xizmatlar', key: 'services' }, { href: '/blog', key: 'blog' },
  { href: '/biz-haqimizda', key: 'about' }, { href: '/aloqa', key: 'contact' },
] as const;

export function Header({ phone }: { phone: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const scrolled = useScrolled(24);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const overHero = pathname === '/' && !scrolled;
  return <header data-tone={overHero ? 'dark' : undefined} className={cn('fixed inset-x-0 top-0 z-50 transition-colors duration-300', overHero ? 'border-b border-white/15 !bg-transparent' : 'border-b border-line bg-surface/95 backdrop-blur-xl')}>
    <div className="container-page flex h-20 items-center justify-between gap-4 lg:h-24">
      <Link href="/" aria-label="AYN TRAVEL" className="flex shrink-0 items-center gap-3">
        <Image src="/logo.jpg" alt="" width={44} height={44} className="size-10 rounded-full object-cover lg:size-11" priority />
        <span className="font-display text-lg font-extrabold tracking-tight text-ink lg:text-xl">AYN <span className="text-accent">TRAVEL</span></span>
      </Link>
      <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t('menu')}>
        {NAV.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} className={cn('rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:text-accent', pathname === item.href ? 'text-accent' : 'text-ink/80')}>{t(item.key)}</Link>)}
      </nav>
      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        <a href={`tel:${phone}`} className="hidden min-h-11 items-center gap-2 rounded-full border border-current/25 px-4 text-sm font-semibold text-ink sm:flex"><Phone className="size-4" /><span className="hidden xl:inline">{displayPhone(phone)}</span></a>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="flex size-11 items-center justify-center rounded-full border border-current/25 text-ink lg:hidden" aria-label={t('menu')}><Menu className="size-5" /></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[70] bg-navy-950/60 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-[80] flex w-[min(90vw,420px)] flex-col overflow-y-auto bg-white p-6 shadow-2xl" aria-describedby={undefined}>
              <div className="flex items-center justify-between border-b border-line pb-6"><Dialog.Title className="font-display text-xl font-extrabold text-navy-900">AYN TRAVEL</Dialog.Title><Dialog.Close aria-label={t('close')} className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-navy-900"><X className="size-5" /></Dialog.Close></div>
              <nav className="flex flex-col py-6" aria-label={t('menu')}>{NAV.map((item, index) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={pathname === item.href ? 'page' : undefined} className="flex items-center gap-4 border-b border-line py-5 text-lg font-semibold text-navy-900"><span className="text-xs font-normal text-ink-subtle">0{index + 1}</span>{t(item.key)}<ArrowUpRight className="ml-auto size-5" /></Link>)}</nav>
              <a href={`tel:${phone}`} className="travel-button mt-auto justify-center"><Phone className="size-4" />{displayPhone(phone)}</a>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
    <motion.div className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gold-400" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
  </header>;
}
