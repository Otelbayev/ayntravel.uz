import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { paginationSchema } from '../../shared/index.js';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginate } from '../../utils/respond.js';
import { notFound } from '../../utils/errors.js';
import { validate, validated } from '../../middleware/validate.js';
import {
  destinationInclude,
  postInclude,
  testimonialInclude,
  toDestination,
  toFaq,
  toPage,
  toPost,
  toService,
  toTestimonial,
  toTour,
  tourInclude,
} from '../../services/dto.js';
import { getSettingsResolved } from '../../services/settings.js';
import { background } from '../../utils/background.js';

export const contentRouter: Router = Router();

/**
 * Yo'nalishlar bo'yicha turlar soni va eng arzon narx — BITTA agregatsiyada.
 *
 * Ilgari ikkita ish bajarilardi: har qatorga korrelyatsiyalangan `_count`
 * subquery VA to'liq `groupBy`. `groupBy` ikkala raqamni ham bitta skanda
 * beradi. `destinationIds` bilan cheklaymiz — bosh sahifa 12 ta yo'nalish
 * ko'rsatgani holda barcha turlarni skanerlash ortiqcha.
 */
async function tourStatsByDestination(destinationIds: string[]) {
  if (destinationIds.length === 0) {
    return new Map<string, { count: number; minPrice: Prisma.Decimal | null }>();
  }
  const rows = await prisma.tour.groupBy({
    by: ['destinationId'],
    where: { status: 'PUBLISHED', destinationId: { in: destinationIds } },
    _count: { _all: true },
    _min: { priceFrom: true },
  });
  return new Map(
    rows.map((r) => [r.destinationId, { count: r._count._all, minPrice: r._min.priceFrom }]),
  );
}

/** GET /api/destinations — faol yo'nalishlar, har biriga turlar soni va eng past narx. */
contentRouter.get(
  '/destinations',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.destination.findMany({
      where: { isActive: true },
      include: destinationInclude,
      orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
    });

    const stats = await tourStatsByDestination(rows.map((r) => r.id));

    return ok(
      res,
      rows.map((row) => {
        const s = stats.get(row.id);
        return toDestination({
          ...row,
          _count: { tours: s?.count ?? 0 },
          minPrice: s?.minPrice ?? null,
        });
      }),
    );
  }),
);

/**
 * GET /api/destinations/nav — header/footer navigatsiyasi uchun yengil ro'yxat.
 *
 * Layout HAR sahifada yo'nalishlarni yuklaydi; to'liq `/api/destinations` esa
 * hero rasmlari va agregatsiyani ham tortadi. Navigatsiyaga faqat nom va slug
 * kerak, shuning uchun alohida, arzon va uzoqroq keshlanadigan endpoint.
 */
contentRouter.get(
  '/destinations/nav',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.destination.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, nameUz: true, nameRu: true },
      orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
    });
    return ok(res, rows);
  }),
);

/**
 * GET /api/destinations/:slug — yo'nalish landingi + shu yo'nalishdagi turlar.
 *
 * Turlar sahifalanadi: ilgari qattiq `take: 24` edi va 25-turdan keyingilari
 * landing sahifasidan umuman ochilmasdi. `total` bilan birga `minPrice` ham
 * to'liq to'plamdan hisoblanadi — bosh sahifadagi narx bilan mos bo'lsin.
 */
contentRouter.get(
  '/destinations/:slug',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = validated<typeof paginationSchema>(req);

    const destination = await prisma.destination.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: destinationInclude,
    });
    if (!destination) throw notFound('Yo‘nalish topilmadi');

    const where = { destinationId: destination.id, status: 'PUBLISHED' as const };
    const [tours, stats] = await Promise.all([
      prisma.tour.findMany({
        where,
        include: tourInclude,
        orderBy: [{ departureDate: 'asc' }, { priceFrom: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      tourStatsByDestination([destination.id]),
    ]);
    const s = stats.get(destination.id);

    return ok(res, {
      destination: toDestination({
        ...destination,
        _count: { tours: s?.count ?? 0 },
        minPrice: s?.minPrice ?? null,
      }),
      tours: paginate(tours.map(toTour), s?.count ?? 0, page, pageSize),
    });
  }),
);

/** GET /api/posts — blog ro'yxati. */
contentRouter.get(
  '/posts',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = validated<typeof paginationSchema>(req);
    const where = { status: 'PUBLISHED' as const, publishedAt: { lte: new Date() } };

    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: postInclude,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

    return ok(res, paginate(rows.map(toPost), total, page, pageSize));
  }),
);

contentRouter.get(
  '/posts/:slug',
  asyncHandler(async (req, res) => {
    const post = await prisma.post.findFirst({
      where: { slug: req.params.slug, status: 'PUBLISHED' },
      include: postInclude,
    });
    if (!post) throw notFound('Maqola topilmadi');

    background(
      prisma.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      }),
      { postId: post.id },
    );

    const related = await prisma.post.findMany({
      where: { status: 'PUBLISHED', id: { not: post.id } },
      include: postInclude,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    return ok(res, { post: toPost(post), related: related.map(toPost) });
  }),
);

contentRouter.get(
  '/services',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }],
    });
    return ok(res, rows.map(toService));
  }),
);

contentRouter.get(
  '/faq',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.faq.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }],
    });
    return ok(res, rows.map(toFaq));
  }),
);

contentRouter.get(
  '/testimonials',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.testimonial.findMany({
      where: { isPublished: true },
      include: testimonialInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 24,
    });
    return ok(res, rows.map(toTestimonial));
  }),
);

contentRouter.get(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const page = await prisma.page.findUnique({ where: { slug: req.params.slug } });
    if (!page) throw notFound('Sahifa topilmadi');
    return ok(res, toPage(page));
  }),
);

contentRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    return ok(res, await getSettingsResolved());
  }),
);

/**
 * GET /api/sitemap-data — sitemap.xml uchun barcha nashr etilgan URL'lar.
 * Faqat slug va updatedAt qaytariladi: sitemap generatsiyasi yengil bo'lishi kerak.
 */
contentRouter.get(
  '/sitemap-data',
  asyncHandler(async (_req, res) => {
    const select = { slug: true, updatedAt: true };
    const [tours, posts, destinations, pages] = await Promise.all([
      prisma.tour.findMany({ where: { status: 'PUBLISHED' }, select }),
      prisma.post.findMany({ where: { status: 'PUBLISHED' }, select }),
      prisma.destination.findMany({ where: { isActive: true }, select }),
      prisma.page.findMany({ select }),
    ]);

    const map = (rows: { slug: string; updatedAt: Date }[]) =>
      rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() }));

    return ok(res, {
      tours: map(tours),
      posts: map(posts),
      destinations: map(destinations),
      pages: map(pages),
    });
  }),
);

/** GET /api/home — bosh sahifa uchun barcha bloklar bitta so'rovda. */
contentRouter.get(
  '/home',
  asyncHandler(async (_req, res) => {
    const [hotTours, featuredTours, destinations, services, testimonials, faqs, posts, settings] =
      await Promise.all([
        prisma.tour.findMany({
          where: { status: 'PUBLISHED', isHot: true },
          include: tourInclude,
          orderBy: [{ departureDate: 'asc' }],
          take: 8,
        }),
        prisma.tour.findMany({
          where: { status: 'PUBLISHED', isFeatured: true },
          include: tourInclude,
          orderBy: [{ departureDate: 'asc' }],
          take: 8,
        }),
        prisma.destination.findMany({
          where: { isActive: true },
          include: destinationInclude,
          orderBy: [{ sortOrder: 'asc' }],
          take: 12,
        }),
        prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.testimonial.findMany({
          where: { isPublished: true },
          include: testimonialInclude,
          orderBy: [{ sortOrder: 'asc' }],
          take: 8,
        }),
        prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 8 }),
        prisma.post.findMany({
          where: { status: 'PUBLISHED' },
          include: postInclude,
          orderBy: { publishedAt: 'desc' },
          take: 3,
        }),
        getSettingsResolved(),
      ]);

    // Faqat qaytariladigan 12 ta yo'nalish bo'yicha — barcha turlarni skanerlamaymiz.
    const stats = await tourStatsByDestination(destinations.map((d) => d.id));

    return ok(res, {
      hotTours: hotTours.map(toTour),
      featuredTours: featuredTours.map(toTour),
      destinations: destinations.map((d) => {
        const s = stats.get(d.id);
        return toDestination({
          ...d,
          _count: { tours: s?.count ?? 0 },
          minPrice: s?.minPrice ?? null,
        });
      }),
      services: services.map(toService),
      testimonials: testimonials.map(toTestimonial),
      faqs: faqs.map(toFaq),
      posts: posts.map(toPost),
      settings,
    });
  }),
);
