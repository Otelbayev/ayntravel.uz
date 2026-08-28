import { Router } from 'express';
import type { LeadStatus } from '@ayntravel/shared';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/respond.js';
import { leadInclude, toLead } from '../../services/dto.js';

export const adminDashboardRouter: Router = Router();

/** Toshkent vaqti bo'yicha kun boshi (UTC+5). */
function startOfTashkentDay(daysAgo = 0): Date {
  const now = new Date();
  const tashkent = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  tashkent.setUTCHours(0, 0, 0, 0);
  tashkent.setUTCDate(tashkent.getUTCDate() - daysAgo);
  return new Date(tashkent.getTime() - 5 * 60 * 60 * 1000);
}

adminDashboardRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const today = startOfTashkentDay();
    const week = startOfTashkentDay(7);
    const month = startOfTashkentDay(30);

    const [
      leadsToday,
      leadsWeek,
      leadsMonth,
      byStatus,
      recentLeads,
      topTours,
      tours,
      posts,
      destinations,
    ] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: today } } }),
      prisma.lead.count({ where: { createdAt: { gte: week } } }),
      prisma.lead.count({ where: { createdAt: { gte: month } } }),
      prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.lead.findMany({ include: leadInclude, orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.tour.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          slug: true,
          titleUz: true,
          viewCount: true,
          _count: { select: { leads: true } },
        },
        orderBy: { viewCount: 'desc' },
        take: 6,
      }),
      prisma.tour.count(),
      prisma.post.count(),
      prisma.destination.count(),
    ]);

    const leadsByStatus = { NEW: 0, CONTACTED: 0, BOOKED: 0, LOST: 0, SPAM: 0 } as Record<
      LeadStatus,
      number
    >;
    for (const row of byStatus) leadsByStatus[row.status] = row._count._all;

    return ok(res, {
      leadsToday,
      leadsWeek,
      leadsMonth,
      leadsByStatus,
      recentLeads: recentLeads.map(toLead),
      topTours: topTours.map((t) => ({
        id: t.id,
        slug: t.slug,
        titleUz: t.titleUz,
        viewCount: t.viewCount,
        leadCount: t._count.leads,
      })),
      totals: { tours, posts, destinations },
    });
  }),
);

/** Oxirgi 30 kun bo'yicha kunlik lidlar — dashboard grafigi uchun. */
adminDashboardRouter.get(
  '/leads-chart',
  asyncHandler(async (_req, res) => {
    const from = startOfTashkentDay(29);
    const leads = await prisma.lead.findMany({
      where: { createdAt: { gte: from } },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const day = startOfTashkentDay(i).toISOString().slice(0, 10);
      buckets.set(day, 0);
    }
    for (const lead of leads) {
      const day = new Date(lead.createdAt.getTime() + 5 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      if (buckets.has(day)) buckets.set(day, buckets.get(day)! + 1);
    }

    return ok(
      res,
      [...buckets.entries()].map(([date, count]) => ({ date, count })),
    );
  }),
);
