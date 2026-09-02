'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  ExternalLink,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  LogOut,
  Map,
  Menu,
  MessageSquareQuote,
  Plane,
  Settings,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { UserDTO } from '@/shared';
import { adminClient } from '@/lib/admin-client';
import { useAdminResource } from '@/hooks/useAdminResource';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Boshqaruv paneli', icon: BarChart3, exact: true },
  { href: '/admin/leads', label: 'Arizalar', icon: Inbox },
  { href: '/admin/tours', label: 'Turlar', icon: Plane },
  { href: '/admin/destinations', label: 'Yo‘nalishlar', icon: Map },
  { href: '/admin/posts', label: 'Blog', icon: FileText },
  { href: '/admin/media', label: 'Rasmlar', icon: ImageIcon },
  { href: '/admin/services', label: 'Xizmatlar', icon: Wrench },
  { href: '/admin/testimonials', label: 'Fikrlar', icon: MessageSquareQuote },
  { href: '/admin/faq', label: 'Savol-javob', icon: HelpCircle },
  { href: '/admin/pages', label: 'Statik sahifalar', icon: FileText },
  { href: '/admin/users', label: 'Foydalanuvchilar', icon: Users, adminOnly: true },
  { href: '/admin/settings', label: 'Sozlamalar', icon: Settings },
];

interface Props {
  children: ReactNode;
  title: string;
  /** Sarlavha yonidagi tugmalar (masalan "Yangi tur"). */
  actions?: ReactNode;
}

export function AdminShell({ children, title, actions }: Props) {
  const pathname = usePathname();
  const { data: user } = useAdminResource<UserDTO>('/api/auth/me');
  const [open, setOpen] = useState(false);

  const visibleNav = NAV.filter((item) => !item.adminOnly || user?.role === 'ADMIN');

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex min-h-screen">
      {/* Yon panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-5">
          <Image
            src="/logo.jpg"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
          <span className="font-display leading-none font-black text-ink">
            AYN <span className="text-gold-gradient">TRAVEL</span>
          </span>
        </div>

        {/* Havola bosilganda mobil menyu yopiladi — effekt ichida
            `setState` chaqirmaslik uchun to'g'ridan-to'g'ri hodisada. */}
        <nav
          className="flex-1 overflow-y-auto p-3"
          aria-label="Admin navigatsiyasi"
          onClick={() => setOpen(false)}
        >
          <ul className="flex flex-col gap-1">
            {visibleNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(item)
                      ? 'bg-gold-500/12 text-accent'
                      : 'text-ink-muted hover:bg-ink/5 hover:text-ink',
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <a
            href="/uz"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Saytni ochish
          </a>

          {user && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-500 font-display text-sm font-bold text-navy-950">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="truncate text-xs text-ink-subtle">
                  {user.role === 'ADMIN' ? 'Administrator' : 'Menejer'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void adminClient.logout()}
                aria-label="Chiqish"
                className="rounded-lg p-1.5 text-ink-subtle transition-colors hover:bg-hot-500/10 hover:text-hot-400"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobil menyu ochiqligida orqa fon */}
      {open && (
        <button
          type="button"
          aria-label="Menyuni yopish"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Asosiy qism */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface-raised/90 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-ink transition-colors hover:bg-ink/10 lg:hidden"
            aria-label={open ? 'Menyuni yopish' : 'Menyuni ochish'}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <h1 className="font-display min-w-0 flex-1 truncate text-lg font-bold text-ink">
            {title}
          </h1>

          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
