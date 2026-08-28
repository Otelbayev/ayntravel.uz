import { Router } from 'express';
import { destinationSchema } from '@ayntravel/shared';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/respond.js';
import { notFound, conflict } from '../../utils/errors.js';
import { validate } from '../../middleware/validate.js';
import { destinationInclude, toDestination } from '../../services/dto.js';
import { CacheTags, localizedPaths, revalidate } from '../../services/revalidate.js';
import { logAudit } from '../../services/audit.js';

export const adminDestinationsRouter: Router = Router();

const patchSchema = destinationSchema.partial();
const touch = (slug?: string) =>
  revalidate({
    tags: [CacheTags.destinations, CacheTags.tours, CacheTags.sitemap],
    paths: [...localizedPaths.lists(), ...(slug ? localizedPaths.destination(slug) : [])],
  });

adminDestinationsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.destination.findMany({
      include: {
        ...destinationInclude,
        _count: { select: { tours: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
    });
    return ok(res, rows.map((r) => toDestination(r)));
  }),
);

adminDestinationsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.destination.findUnique({
      where: { id: req.params.id },
      include: destinationInclude,
    });
    if (!row) throw notFound('Yo‘nalish topilmadi');
    return ok(res, toDestination(row));
  }),
);

adminDestinationsRouter.post(
  '/',
  validate(destinationSchema),
  asyncHandler(async (req, res) => {
    const row = await prisma.destination.create({
      data: req.body,
      include: destinationInclude,
    });
    await logAudit(req.user?.sub, 'destination', row.id, 'create', { slug: row.slug });
    void touch(row.slug);
    return ok(res, toDestination(row), 201);
  }),
);

adminDestinationsRouter.patch(
  '/:id',
  validate(patchSchema),
  asyncHandler(async (req, res) => {
    const row = await prisma.destination.update({
      where: { id: req.params.id },
      data: req.body,
      include: destinationInclude,
    });
    await logAudit(req.user?.sub, 'destination', row.id, 'update');
    void touch(row.slug);
    return ok(res, toDestination(row));
  }),
);

adminDestinationsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    // Yo'nalishga bog'langan tur bo'lsa o'chirishga yo'l qo'ymaymiz —
    // aks holda turlar "yetim" qolib, sayt buziladi.
    const count = await prisma.tour.count({ where: { destinationId: req.params.id } });
    if (count > 0) {
      throw conflict(`Bu yo‘nalishda ${count} ta tur bor. Avval ularni o‘chiring yoki ko‘chiring`);
    }
    await prisma.destination.delete({ where: { id: req.params.id } });
    await logAudit(req.user?.sub, 'destination', req.params.id, 'delete');
    void touch();
    return ok(res, { id: req.params.id, deleted: true });
  }),
);
