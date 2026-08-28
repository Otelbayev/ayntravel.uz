import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { paginationSchema, postSchema } from '@ayntravel/shared';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginate } from '../../utils/respond.js';
import { notFound } from '../../utils/errors.js';
import { validate, validated } from '../../middleware/validate.js';
import { postInclude, toPost } from '../../services/dto.js';
import { CacheTags, localizedPaths, revalidate } from '../../services/revalidate.js';
import { logAudit } from '../../services/audit.js';

export const adminPostsRouter: Router = Router();

const patchSchema = postSchema.partial();
const listQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  search: z.string().max(120).optional(),
});

/** O'rtacha o'qish tezligi ~200 so'z/daqiqa. HTML teglari hisobga olinmaydi. */
function estimateReadingTime(html: string | null | undefined): number {
  if (!html) return 1;
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function toPrismaData(body: z.infer<typeof patchSchema>, existingPublishedAt?: Date | null) {
  const data: Prisma.PostUncheckedUpdateInput = { ...body } as Prisma.PostUncheckedUpdateInput;

  if (body.bodyUz !== undefined) data.readingTime = estimateReadingTime(body.bodyUz);

  if (body.status) {
    if (body.status === 'PUBLISHED' && !existingPublishedAt) data.publishedAt = new Date();
    if (body.status === 'DRAFT') data.publishedAt = null;
  }

  for (const key of Object.keys(data)) {
    if ((data as Record<string, unknown>)[key] === '') {
      (data as Record<string, unknown>)[key] = null;
    }
  }
  return data;
}

/** Teglar + aniq manzillar (nashrdan oldin keshlangan 404 ni tozalash uchun). */
const touch = (slug?: string) =>
  revalidate({
    tags: [CacheTags.posts, CacheTags.sitemap, ...(slug ? [`post:${slug}`] : [])],
    paths: [...localizedPaths.lists(), ...(slug ? localizedPaths.post(slug) : [])],
  });

adminPostsRouter.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = validated<typeof listQuerySchema>(req);
    const where: Prisma.PostWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.search) {
      where.OR = [
        { titleUz: { contains: q.search, mode: 'insensitive' } },
        { titleRu: { contains: q.search, mode: 'insensitive' } },
        { slug: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.post.count({ where }),
    ]);
    return ok(res, paginate(rows.map(toPost), total, q.page, q.pageSize));
  }),
);

adminPostsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.post.findUnique({ where: { id: req.params.id }, include: postInclude });
    if (!row) throw notFound('Maqola topilmadi');
    return ok(res, toPost(row));
  }),
);

adminPostsRouter.post(
  '/',
  validate(postSchema),
  asyncHandler(async (req, res) => {
    const row = await prisma.post.create({
      data: toPrismaData(req.body, null) as Prisma.PostUncheckedCreateInput,
      include: postInclude,
    });
    await logAudit(req.user?.sub, 'post', row.id, 'create', { slug: row.slug });
    void touch(row.slug);
    return ok(res, toPost(row), 201);
  }),
);

adminPostsRouter.patch(
  '/:id',
  validate(patchSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { publishedAt: true },
    });
    if (!existing) throw notFound('Maqola topilmadi');

    const row = await prisma.post.update({
      where: { id: req.params.id },
      data: toPrismaData(req.body, existing.publishedAt),
      include: postInclude,
    });
    await logAudit(req.user?.sub, 'post', row.id, 'update');
    void touch(row.slug);
    return ok(res, toPost(row));
  }),
);

adminPostsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const removed = await prisma.post.delete({ where: { id: req.params.id } });
    await logAudit(req.user?.sub, 'post', req.params.id, 'delete');
    void touch(removed.slug);
    return ok(res, { id: req.params.id, deleted: true });
  }),
);
