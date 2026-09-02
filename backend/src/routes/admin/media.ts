import { Router } from 'express';
import multer from 'multer';
import {
  ALLOWED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  mediaUpdateSchema,
  paginationSchema,
  type MediaVariants,
} from '../../shared/index.js';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginate } from '../../utils/respond.js';
import { badRequest, conflict, notFound } from '../../utils/errors.js';
import { validate, validated } from '../../middleware/validate.js';
import { mediaSelect, toMedia } from '../../services/dto.js';
import { deleteImageFiles, processImage } from '../../services/images.js';
import { logAudit } from '../../services/audit.js';

export const adminMediaRouter: Router = Router();

/**
 * Fayl xotirada ushlanadi (diskka emas) — sharp uni to'g'ridan-to'g'ri buferdan
 * o'qiydi va faqat tayyor variantlar saqlanadi. Xom fayl hech qachon yozilmaydi.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!(ALLOWED_UPLOAD_MIME as readonly string[]).includes(file.mimetype)) {
      return cb(new Error('Faqat JPG, PNG, WebP yoki AVIF rasm yuklash mumkin'));
    }
    cb(null, true);
  },
});

adminMediaRouter.get(
  '/',
  validate(paginationSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = validated<typeof paginationSchema>(req);
    const [rows, total] = await Promise.all([
      prisma.media.findMany({
        select: mediaSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.media.count(),
    ]);
    return ok(res, paginate(rows.map((r) => toMedia(r)!), total, page, pageSize));
  }),
);

/** POST /api/admin/media/upload — bir vaqtda 10 tagacha rasm. */
adminMediaRouter.post(
  '/upload',
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw badRequest('Rasm tanlanmadi');

    const created = [];
    for (const file of files) {
      const processed = await processImage(file.buffer, file.originalname);
      const media = await prisma.media.create({
        data: {
          filename: processed.filename,
          originalName: file.originalname.slice(0, 200),
          mimeType: file.mimetype,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
          variants: processed.variants as never,
          blurDataUrl: processed.blurDataUrl,
          uploadedById: req.user?.sub ?? null,
        },
        select: mediaSelect,
      });
      created.push(toMedia(media)!);
    }

    await logAudit(req.user?.sub, 'media', undefined, 'upload', { count: created.length });
    return ok(res, created, 201);
  }),
);

/**
 * GET /api/admin/media/:id — bitta rasm va u qayerda ishlatilayotgani.
 *
 * Foydalanish sanog'i muhim: admin rasmni o'chirishdan oldin uning
 * saytda ishlatilayotganini ko'rishi kerak (server o'chirishga yo'l
 * qo'ymaydi, lekin sababini oldindan ko'rsatgan yaxshi).
 */
adminMediaRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await prisma.media.findUnique({
      where: { id: req.params.id },
      select: {
        ...mediaSelect,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
        _count: {
          select: {
            tourPosters: true,
            tourGallery: true,
            destinationHeros: true,
            postCovers: true,
            testimonials: true,
          },
        },
      },
    });
    if (!row) throw notFound('Rasm topilmadi');

    const c = row._count;
    return ok(res, {
      ...toMedia(row)!,
      originalName: row.originalName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
      usage: {
        tourPosters: c.tourPosters,
        tourGallery: c.tourGallery,
        destinationHeros: c.destinationHeros,
        postCovers: c.postCovers,
        testimonials: c.testimonials,
        total:
          c.tourPosters +
          c.tourGallery +
          c.destinationHeros +
          c.postCovers +
          c.testimonials,
      },
    });
  }),
);

adminMediaRouter.patch(
  '/:id',
  validate(mediaUpdateSchema),
  asyncHandler(async (req, res) => {
    const row = await prisma.media.update({
      where: { id: req.params.id },
      data: req.body,
      select: mediaSelect,
    });
    return ok(res, toMedia(row));
  }),
);

adminMediaRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const media = await prisma.media.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        variants: true,
        _count: {
          select: {
            tourPosters: true,
            tourGallery: true,
            destinationHeros: true,
            postCovers: true,
            testimonials: true,
          },
        },
      },
    });
    if (!media) throw notFound('Rasm topilmadi');

    const used =
      media._count.tourPosters +
      media._count.tourGallery +
      media._count.destinationHeros +
      media._count.postCovers +
      media._count.testimonials;

    // Ishlatilayotgan rasmni o'chirish saytda "singan rasm" qoldiradi.
    if (used > 0) {
      throw conflict(`Bu rasm ${used} ta joyda ishlatilmoqda. Avval u yerlardan olib tashlang`);
    }

    await prisma.media.delete({ where: { id: media.id } });
    await deleteImageFiles(media.variants as MediaVariants);
    await logAudit(req.user?.sub, 'media', media.id, 'delete');

    return ok(res, { id: media.id, deleted: true });
  }),
);
