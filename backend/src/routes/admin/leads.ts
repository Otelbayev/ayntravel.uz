import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { formatUzPhone, leadQuerySchema, updateLeadSchema } from '../../shared/index.js';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginate } from '../../utils/respond.js';
import { notFound } from '../../utils/errors.js';
import { validate, validated } from '../../middleware/validate.js';
import { leadInclude, toLead } from '../../services/dto.js';
import { notifyLeadStatus } from '../../services/telegram.js';
import { logAudit } from '../../services/audit.js';

export const adminLeadsRouter: Router = Router();

function buildWhere(q: import('zod').infer<typeof leadQuerySchema>): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.source) where.source = q.source;
  if (q.from || q.to) {
    where.createdAt = {
      ...(q.from ? { gte: new Date(q.from) } : {}),
      ...(q.to ? { lte: new Date(q.to) } : {}),
    };
  }
  if (q.search) {
    // Menejer odatda telefon oxirgi raqamlari yoki ism bo'yicha qidiradi.
    const digits = q.search.replace(/\D/g, '');
    where.OR = [
      { name: { contains: q.search, mode: 'insensitive' } },
      ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
      { message: { contains: q.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

adminLeadsRouter.get(
  '/',
  validate(leadQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = validated<typeof leadQuerySchema>(req);
    const where = buildWhere(q);

    const [rows, total, byStatus] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: leadInclude,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.lead.count({ where }),
      prisma.lead.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return ok(res, {
      ...paginate(rows.map(toLead), total, q.page, q.pageSize),
      counts: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
    });
  }),
);

/**
 * GET /api/admin/leads/export — CSV.
 * Excel kirillcha matnni to'g'ri ochishi uchun BOM qo'shiladi va `;` ajratkich
 * ishlatiladi (ru/uz lokalidagi Excel aynan shunday kutadi).
 */
adminLeadsRouter.get(
  '/export',
  asyncHandler(async (req, res) => {
    const parsed = leadQuerySchema.partial().safeParse(req.query);
    const where = parsed.success
      ? buildWhere(parsed.data as import('zod').infer<typeof leadQuerySchema>)
      : {};

    const rows = await prisma.lead.findMany({
      where,
      include: leadInclude,
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const escape = (value: unknown): string => {
      const s = value === null || value === undefined ? '' : String(value);
      return `"${s.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    };

    const header = [
      'Sana',
      'Ism',
      'Telefon',
      'Tur',
      'Manba',
      'Til',
      'Status',
      'Izoh',
      'Menejer izohi',
    ];

    const lines = [
      header.map(escape).join(';'),
      ...rows.map((r) =>
        [
          r.createdAt.toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' }),
          r.name,
          formatUzPhone(r.phone),
          r.tour?.titleUz ?? '',
          r.source,
          r.locale,
          r.status,
          r.message ?? '',
          r.managerNote ?? '',
        ]
          .map(escape)
          .join(';'),
      ),
    ];

    const csv = '﻿' + lines.join('\r\n');
    const filename = `ayn-travel-lidlar-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }),
);

adminLeadsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.lead.findUnique({ where: { id: req.params.id }, include: leadInclude });
    if (!row) throw notFound('Ariza topilmadi');
    return ok(res, toLead(row));
  }),
);

adminLeadsRouter.patch(
  '/:id',
  validate(updateLeadSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as { status?: import('../../shared/index.js').LeadStatus; managerNote?: string };

    const data: Prisma.LeadUncheckedUpdateInput = { ...body };
    // Status "bog'lanildi"ga o'tganda vaqtni avtomatik belgilaymiz —
    // menejer javob tezligini keyin o'lchash mumkin bo'ladi.
    if (body.status && body.status !== 'NEW') data.contactedAt = new Date();
    if (body.status) data.assignedToId = req.user?.sub ?? null;

    const row = await prisma.lead.update({
      where: { id: req.params.id },
      data,
      include: leadInclude,
    });

    await logAudit(req.user?.sub, 'lead', row.id, `status:${row.status}`);

    if (body.status === 'BOOKED') {
      const manager = await prisma.user.findUnique({
        where: { id: req.user!.sub },
        select: { name: true },
      });
      void notifyLeadStatus(row, 'BOOKED', manager?.name ?? 'Menejer');
    }

    return ok(res, toLead(row));
  }),
);

adminLeadsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.lead.delete({ where: { id: req.params.id } });
    await logAudit(req.user?.sub, 'lead', req.params.id, 'delete');
    return ok(res, { id: req.params.id, deleted: true });
  }),
);
