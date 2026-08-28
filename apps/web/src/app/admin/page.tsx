'use client';

import { useAdminResource } from '@/hooks/useAdminResource';
import Link from 'next/link';
import { ArrowRight, Eye, Inbox } from 'lucide-react';
import type { DashboardStats } from '@ayntravel/shared';
import { formatUzPhone } from '@ayntravel/shared';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  Card,
  EmptyState,
  ErrorBox,
  LeadStatusBadge,
  Spinner,
  StatCard,
  TableWrap,
  Td,
  Th,
} from '@/components/admin/ui';

export default function DashboardPage() {
  const {
    data: stats,
    loading,
    error,
    reload,
  } = useAdminResource<DashboardStats>('/api/admin/dashboard');

  return (
    <AdminShell title="Boshqaruv paneli">
      {error && <ErrorBox message={error} onRetry={reload} />}

      {loading && !stats ? (
        <Spinner />
      ) : stats ? (
        <div className="flex flex-col gap-6">
          {/* Asosiy raqamlar */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Bugungi arizalar"
              value={stats.leadsToday}
              accent="gold"
              hint="Toshkent vaqti bo‘yicha"
            />
            <StatCard label="Oxirgi 7 kun" value={stats.leadsWeek} />
            <StatCard label="Oxirgi 30 kun" value={stats.leadsMonth} />
            <StatCard
              label="Yangi (javob kutmoqda)"
              value={stats.leadsByStatus.NEW}
              accent={stats.leadsByStatus.NEW > 0 ? 'hot' : undefined}
              hint={stats.leadsByStatus.NEW > 0 ? 'Bog‘lanish kerak!' : 'Hammasi ko‘rib chiqilgan'}
            />
          </div>

          {/* Statuslar bo'yicha taqsimot */}
          <Card>
            <h2 className="font-display mb-4 font-bold text-ink">Arizalar holati</h2>
            <div className="flex flex-wrap gap-3">
              {(
                Object.entries(stats.leadsByStatus) as [
                  keyof typeof stats.leadsByStatus,
                  number,
                ][]
              ).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <LeadStatusBadge status={status} />
                  <span className="font-display text-lg font-bold text-ink">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Oxirgi arizalar */}
            <Card className="p-0">
              <div className="flex items-center justify-between border-b border-line p-5">
                <h2 className="font-display font-bold text-ink">Oxirgi arizalar</h2>
                <Link
                  href="/admin/leads"
                  className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                >
                  Barchasi
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>

              {stats.recentLeads.length === 0 ? (
                <EmptyState title="Hozircha ariza yo‘q" />
              ) : (
                <ul className="divide-y divide-white/5">
                  {stats.recentLeads.map((lead) => (
                    <li key={lead.id}>
                      <Link
                        href={`/admin/leads?search=${encodeURIComponent(lead.phone)}`}
                        className="flex items-center gap-3 p-4 transition-colors hover:bg-ink/5"
                      >
                        <Inbox className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-ink">{lead.name}</p>
                          <p className="truncate text-xs text-ink-subtle">
                            {formatUzPhone(lead.phone)}
                            {lead.tour ? ` · ${lead.tour.titleUz}` : ''}
                          </p>
                        </div>
                        <LeadStatusBadge status={lead.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Eng ko'p ko'rilgan turlar */}
            <Card className="p-0">
              <div className="border-b border-line p-5">
                <h2 className="font-display font-bold text-ink">Ommabop turlar</h2>
                <p className="mt-1 text-xs text-ink-subtle">
                  Ko‘rishlar va shu turdan kelgan arizalar
                </p>
              </div>

              {stats.topTours.length === 0 ? (
                <EmptyState title="Hozircha ma’lumot yo‘q" />
              ) : (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Tur</Th>
                      <Th className="w-24">Ko‘rish</Th>
                      <Th className="w-24">Ariza</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topTours.map((tour) => (
                      <tr key={tour.id}>
                        <Td>
                          <Link
                            href={`/admin/tours/${tour.id}`}
                            className="hover:text-accent"
                          >
                            {tour.titleUz}
                          </Link>
                        </Td>
                        <Td>
                          <span className="flex items-center gap-1.5 text-ink-muted">
                            <Eye className="size-3.5" aria-hidden="true" />
                            {tour.viewCount}
                          </span>
                        </Td>
                        <Td>
                          <span className="font-semibold text-accent">{tour.leadCount}</span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Card>
          </div>

          {/* Kontent hajmi */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Turlar" value={stats.totals.tours} />
            <StatCard label="Yo‘nalishlar" value={stats.totals.destinations} />
            <StatCard label="Maqolalar" value={stats.totals.posts} />
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
