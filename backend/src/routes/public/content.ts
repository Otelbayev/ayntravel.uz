import { Router } from 'express';
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
import { getSettings } from '../../services/settings.js';

export const contentRouter: Router = Router();

/** GET /api/destinations — faol yo'nalishlar, har biriga turlar soni va eng past narx. */
contentRouter.get(
  '/destinations',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.destination.findMany({
      where: { isActive: true },
      include: {
        ...destinationInclude,
        _count: { select: { tours: { where: { status: 'PUBLISHED' } } } },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameUz: 'asc' }],
    });

    // Eng arzon narxni alohida so'rov bilan olamiz — kartochkada "500$ dan" ko'rsatiladi.
    const minPrices = await prisma.tour.groupBy({
      by: ['destinationId'],
      where: { status: 'PUBLISHED' },
      _min: { priceFrom: true },
    });
    const priceMap = new Map(minPrices.map((p) => [p.destinationId, p._min.priceFrom]));

    return ok(
      res,
      rows.map((row) => toDestination({ ...row, minPrice: priceMap.get(row.id) ?? null })),
    );
  }),
);

/** GET /api/destinations/:slug — yo'nalish landingi + shu yo'nalishdagi turlar. */
contentRouter.get(
  '/destinations/:slug',
  asyncHandler(async (req, res) => {
    const destination = await prisma.destination.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: destinationInclude,
    });
    if (!destination) throw notFound('Yo‘nalish topilmadi');

    const tours = await prisma.tour.findMany({
      where: { destinationId: destination.id, status: 'PUBLISHED' },
      include: tourInclude,
      orderBy: [{ departureDate: 'asc' }, { priceFrom: 'asc' }],
      take: 24,
    });

    return ok(res, { destination: toDestination(destination), tours: tours.map(toTour) });
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

    void prisma.post
      .update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

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
    return ok(res, await getSettings());
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
          include: {
            ...destinationInclude,
            _count: { select: { tours: { where: { status: 'PUBLISHED' } } } },
          },
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
        getSettings(),
      ]);

    const minPrices = await prisma.tour.groupBy({
      by: ['destinationId'],
      where: { status: 'PUBLISHED' },
      _min: { priceFrom: true },
    });
    const priceMap = new Map(minPrices.map((p) => [p.destinationId, p._min.priceFrom]));

    return ok(res, {
      hotTours: hotTours.map(toTour),
      featuredTours: featuredTours.map(toTour),
      destinations: destinations.map((d) =>
        toDestination({ ...d, minPrice: priceMap.get(d.id) ?? null }),
      ),
      services: services.map(toService),
      testimonials: testimonials.map(toTestimonial),
      faqs: faqs.map(toFaq),
      posts: posts.map(toPost),
      settings,
    });
  }),
);
