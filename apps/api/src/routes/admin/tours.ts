import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { paginationSchema, tourSchema } from '@ayntravel/shared';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginate } from '../../utils/respond.js';
import { notFound } from '../../utils/errors.js';
import { validate, validated } from '../../middleware/validate.js';
import { toTour, tourInclude } from '../../services/dto.js';
import { CacheTags, localizedPaths, revalidate } from '../../services/revalidate.js';
import { logAudit } from '../../services/audit.js';

export const adminToursRouter: Router = Router();

const listQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  search: z.string().max(120).optional(),
  destinationId: z.string().optional(),
});

const patchSchema = tourSchema.partial();

type TourBody = z.infer<typeof patchSchema>;

/**
 * Zod natijasini Prisma `data` ga o'giradi.
 * Galereya alohida jadvalda saqlangani uchun uni ajratib olamiz.
 */
function toPrismaData(body: TourBody, existingPublishedAt?: Date | null) {
  const { galleryImageIds, destinationId, status, ...rest } = body;

  const data: Prisma.TourUncheckedUpdateInput = { ...rest } as Prisma.TourUncheckedUpdateInput;

  if (destinationId) data.destinationId = destinationId;
  if (status) {
    data.status = status;
    // Birinchi marta nashr qilinganda sana qo'yiladi; qayta nashrda o'zgarmaydi,
    // shunda blogdagi/sitemapdagi "chop etilgan sana" sakramaydi.
    if (status === 'PUBLISHED' && !existingPublishedAt) data.publishedAt = new Date();
    if (status === 'DRAFT') data.publishedAt = null;
  }

  // Bo'sh satrlarni null'ga aylantiramiz — bazada '' va null aralashib ketmasin.
  for (const key of Object.keys(data) as (keyof typeof data)[]) {
    if (data[key] === '') (data as Record<string, unknown>)[key as string] = null;
  }

  return { data, galleryImageIds };
}

async function syncGallery(tourId: string, mediaIds: string[] | undefined) {
  if (!mediaIds) return;
  await prisma.$transaction([
    prisma.tourImage.deleteMany({ where: { tourId } }),
    ...(mediaIds.length
      ? [
          prisma.tourImage.createMany({
            data: mediaIds.map((mediaId, index) => ({ tourId, mediaId, sortOrder: index })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}

/**
 * Keshni yangilaydi: teglar (ma'lumot keshi) va aniq manzillar (marshrut keshi).
 *
 * Manzillar bo'lmasa muhim xato yuz beradi — tur nashr etilishidan oldin
 * kimdir uning manzilini ochgan bo'lsa, Next 404 ni keshlab qo'yadi va uni
 * teg bo'yicha tozalab bo'lmaydi: o'sha 404 hech qanday fetch tegiga
 * bog'lanmagan. Natijada tur nashr etilsa ham sahifa 404 bo'lib qolaverardi.
 */
const touch = (slug?: string) =>
  revalidate({
    tags: [
      CacheTags.tours,
      CacheTags.destinations,
      CacheTags.sitemap,
      ...(slug ? [`tour:${slug}`] : []),
    ],
    paths: [...localizedPaths.lists(), ...(slug ? localizedPaths.tour(slug) : [])],
  });

adminToursRouter.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = validated<typeof listQuerySchema>(req);
    const where: Prisma.TourWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.destinationId) where.destinationId = q.destinationId;
    if (q.search) {
      where.OR = [
        { titleUz: { contains: q.search, mode: 'insensitive' } },
        { titleRu: { contains: q.search, mode: 'insensitive' } },
        { slug: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.tour.findMany({
        where,
        include: tourInclude,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.tour.count({ where }),
    ]);

    return ok(res, paginate(rows.map(toTour), total, q.page, q.pageSize));
  }),
);

adminToursRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.tour.findUnique({ where: { id: req.params.id }, include: tourInclude });
    if (!row) throw notFound('Tur topilmadi');
    return ok(res, toTour(row));
  }),
);

adminToursRouter.post(
  '/',
  validate(tourSchema),
  asyncHandler(async (req, res) => {
    const { data, galleryImageIds } = toPrismaData(req.body as TourBody, null);
    const created = await prisma.tour.create({
      data: data as Prisma.TourUncheckedCreateInput,
      include: tourInclude,
    });
    await syncGallery(created.id, galleryImageIds);
    await logAudit(req.user?.sub, 'tour', created.id, 'create', { slug: created.slug });
    void touch(created.slug);

    const full = await prisma.tour.findUnique({ where: { id: created.id }, include: tourInclude });
    return ok(res, toTour(full!), 201);
  }),
);

adminToursRouter.patch(
  '/:id',
  validate(patchSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.tour.findUnique({
      where: { id: req.params.id },
      select: { publishedAt: true, slug: true },
    });
    if (!existing) throw notFound('Tur topilmadi');

    const { data, galleryImageIds } = toPrismaData(req.body as TourBody, existing.publishedAt);
    await prisma.tour.update({ where: { id: req.params.id }, data });
    await syncGallery(req.params.id, galleryImageIds);
    await logAudit(req.user?.sub, 'tour', req.params.id, 'update', req.body);

    const full = await prisma.tour.findUnique({
      where: { id: req.params.id },
      include: tourInclude,
    });

    // Slug o'zgargan bo'lishi mumkin — eski va yangi manzilni ham yangilaymiz.
    void touch(full!.slug);
    if (existing.slug !== full!.slug) void touch(existing.slug);

    return ok(res, toTour(full!));
  }),
);

adminToursRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const removed = await prisma.tour.delete({ where: { id: req.params.id } });
    await logAudit(req.user?.sub, 'tour', req.params.id, 'delete');
    void touch(removed.slug);
    return ok(res, { id: req.params.id, deleted: true });
  }),
);

/** Tez nashr/qoralama almashtirish — ro'yxatdagi bitta tugma uchun. */
adminToursRouter.post(
  '/:id/publish',
  validate(z.object({ status: z.enum(['DRAFT', 'PUBLISHED']) })),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status: 'DRAFT' | 'PUBLISHED' };
    const existing = await prisma.tour.findUnique({
      where: { id: req.params.id },
      select: { publishedAt: true },
    });
    if (!existing) throw notFound('Tur topilmadi');

    const row = await prisma.tour.update({
      where: { id: req.params.id },
      data: {
        status,
        publishedAt:
          status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : null,
      },
      include: tourInclude,
    });
    await logAudit(req.user?.sub, 'tour', row.id, `status:${status}`);
    void touch(row.slug);
    return ok(res, toTour(row));
  }),
);
