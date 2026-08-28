import { Router, type Request } from 'express';
import type { Prisma } from '@prisma/client';
import { tourQuerySchema, type TourQuery } from '@ayntravel/shared';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginate } from '../../utils/respond.js';
import { notFound } from '../../utils/errors.js';
import { validate, validated } from '../../middleware/validate.js';
import { toTour, tourInclude } from '../../services/dto.js';

export const toursRouter: Router = Router();

const ORDER_BY: Record<TourQuery['sort'], Prisma.TourOrderByWithRelationInput[]> = {
  price_asc: [{ priceFrom: 'asc' }],
  price_desc: [{ priceFrom: 'desc' }],
  date_asc: [{ departureDate: 'asc' }, { createdAt: 'desc' }],
  date_desc: [{ departureDate: 'desc' }],
  newest: [{ publishedAt: 'desc' }],
  popular: [{ viewCount: 'desc' }],
};

/** GET /api/tours — filtrlangan, sahifalangan turlar ro'yxati. */
toursRouter.get(
  '/',
  validate(tourQuerySchema, 'query'),
  asyncHandler(async (req: Request, res) => {
    const q = validated<typeof tourQuerySchema>(req);

    const where: Prisma.TourWhereInput = { status: 'PUBLISHED' };

    if (q.destination) where.destination = { slug: q.destination };
    if (q.hot) where.isHot = true;
    if (q.featured) where.isFeatured = true;
    if (q.stars) where.hotelStars = { gte: q.stars };
    if (q.nights !== undefined) where.durationNights = q.nights;

    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.priceFrom = {
        ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
        ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
      };
    }

    if (q.dateFrom || q.dateTo) {
      where.departureDate = {
        ...(q.dateFrom ? { gte: new Date(q.dateFrom) } : {}),
        ...(q.dateTo ? { lte: new Date(q.dateTo) } : {}),
      };
    }

    if (q.search) {
      // Ikki tilda ham qidiradi — foydalanuvchi qaysi tilda yozganini bilmaymiz.
      where.OR = [
        { titleUz: { contains: q.search, mode: 'insensitive' } },
        { titleRu: { contains: q.search, mode: 'insensitive' } },
        { summaryUz: { contains: q.search, mode: 'insensitive' } },
        { summaryRu: { contains: q.search, mode: 'insensitive' } },
        { citiesUz: { has: q.search } },
        { destination: { nameUz: { contains: q.search, mode: 'insensitive' } } },
        { destination: { nameRu: { contains: q.search, mode: 'insensitive' } } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.tour.findMany({
        where,
        include: tourInclude,
        orderBy: ORDER_BY[q.sort],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.tour.count({ where }),
    ]);

    return ok(res, paginate(rows.map(toTour), total, q.page, q.pageSize));
  }),
);

/** GET /api/tours/:slug — bitta tur + o'xshash turlar. */
toursRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const tour = await prisma.tour.findFirst({
      where: { slug: req.params.slug, status: 'PUBLISHED' },
      include: tourInclude,
    });
    if (!tour) throw notFound('Bunday tur topilmadi');

    // Ko'rishlar sonini fon rejimida oshiramiz — javobni kutib turmaydi.
    void prisma.tour
      .update({ where: { id: tour.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);

    const related = await prisma.tour.findMany({
      where: {
        status: 'PUBLISHED',
        id: { not: tour.id },
        destinationId: tour.destinationId,
      },
      include: tourInclude,
      orderBy: [{ departureDate: 'asc' }],
      take: 4,
    });

    return ok(res, { tour: toTour(tour), related: related.map(toTour) });
  }),
);
