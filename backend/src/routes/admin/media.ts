import { Router } from 'express';
import multer from 'multer';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { z } from 'zod';
import {
  ALLOWED_UPLOAD_MIME,
  ALLOWED_VIDEO_MIME,
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  MEDIA_KINDS,
  mediaQuerySchema,
  mediaUpdateSchema,
  type MediaVariants,
} from '../../shared/index.js';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginate } from '../../utils/respond.js';
import { badRequest, conflict, notFound } from '../../utils/errors.js';
import { validate, validated } from '../../middleware/validate.js';
import { mediaSelect, toMedia } from '../../services/dto.js';
import { deleteImageFiles, makeBaseName, processImage } from '../../services/images.js';
import { deleteVideoFile, storeVideo } from '../../services/videos.js';
import { env } from '../../env.js';
import { isMediaUsedInSettings } from '../../services/settings.js';
import { logAudit } from '../../services/audit.js';
import { background } from '../../utils/background.js';

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

/**
 * Video uchun alohida multer instansi.
 *
 * Bitta marshrutda 12MB va 48MB chegaralarini birga qo'llab bo'lmaydi:
 * `limits` va `fileFilter` handler ishga tushishidan OLDIN baholanadi.
 */
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!(ALLOWED_VIDEO_MIME as readonly string[]).includes(file.mimetype)) {
      return cb(new Error('Faqat MP4 yoki WebM video yuklash mumkin'));
    }
    cb(null, true);
  },
});

/*
 * ══ To'g'ridan-to'g'ri Blob'ga yuklash ═══════════════════════════
 *
 * Vercel serverless funksiyasiga kiruvchi so'rov tanasi 4.5 MB bilan
 * cheklangan — 12 MB rasm yoki 48 MB video quyidagi `/upload`
 * marshrutiga umuman yetib bormaydi (413). Shuning uchun fayl
 * brauzerdan to'g'ridan-to'g'ri Blob'ga ketadi, server esa faqat
 * qisqa muddatli ruxsat tokenini beradi va natijani ro'yxatga oladi.
 *
 * Nega `handleUpload()` emas: uni chaqiradigan `@vercel/blob/client`
 * `upload()` funksiyasi tokenni so'raganda `credentials: 'include'`
 * QO'YMAYDI. API alohida domenda bo'lgani uchun auth cookie yetib
 * bormaydi va `requireAuth` so'rovni rad etadi. O'z endpointimiz esa
 * odatdagi `adminClient` orqali chaqiriladi — cookie joyida.
 */

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const uploadTokenSchema = z.object({
  kind: z.enum(MEDIA_KINDS),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
});

/** POST /api/admin/media/upload-token — brauzerga bir martalik yuklash ruxsati. */
adminMediaRouter.post(
  '/upload-token',
  validate(uploadTokenSchema),
  asyncHandler(async (req, res) => {
    // `validate` tozalangan qiymatni req.body ga qaytadan yozadi
    // (`validated()` esa faqat query uchun — Express 5 da u read-only).
    const { kind, filename, contentType } = req.body as z.infer<typeof uploadTokenSchema>;

    const isVideo = kind === 'VIDEO';
    const allowed = (isVideo ? ALLOWED_VIDEO_MIME : ALLOWED_UPLOAD_MIME) as readonly string[];
    if (!allowed.includes(contentType)) {
      throw badRequest(
        isVideo
          ? 'Faqat MP4 yoki WebM video yuklash mumkin'
          : 'Faqat JPG, PNG, WebP yoki AVIF rasm yuklash mumkin',
      );
    }

    const base = makeBaseName(filename);
    const ext = EXT_BY_MIME[contentType] ?? 'bin';
    /*
     * Video yakuniy fayl — `storeVideo` bilan bir xil `YYYY-MM/nom.ext`
     * shaklida bo'lishi SHART, chunki o'chirish kalitni URL oxiridagi
     * ikki bo'lakdan tiklaydi. Rasm esa vaqtinchalik: `finalize` uni
     * sharp bilan qayta ishlab, variantlarni yozadi va xomini o'chiradi.
     */
    const pathname = isVideo
      ? `${new Date().toISOString().slice(0, 7)}/${base}.${ext}`
      : `tmp/${base}.${ext}`;

    const token = await generateClientTokenFromReadWriteToken({
      pathname,
      allowedContentTypes: [contentType],
      maximumSizeInBytes: isVideo ? MAX_VIDEO_UPLOAD_BYTES : MAX_UPLOAD_BYTES,
      addRandomSuffix: false,
      allowOverwrite: true,
      // 15 daqiqa — sekin internetda 48 MB video ulgurishi uchun yetarli,
      // token o'g'irlansa ham foydalanish oynasi tor.
      validUntil: Date.now() + 15 * 60 * 1000,
      cacheControlMaxAge: 31536000,
    });

    return ok(res, { token, pathname });
  }),
);

const finalizeSchema = z.object({
  kind: z.enum(MEDIA_KINDS),
  blobUrl: z.string().url(),
  originalName: z.string().min(1).max(200),
  width: z.coerce.number().int().min(0).optional(),
  height: z.coerce.number().int().min(0).optional(),
  duration: z.coerce.number().int().min(0).optional(),
});

/** POST /api/admin/media/finalize — Blob'ga tushgan faylni ro'yxatga oladi. */
adminMediaRouter.post(
  '/finalize',
  validate(finalizeSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof finalizeSchema>;

    // URL faqat bizning store'imizdan bo'lsin — aks holda bu marshrut
    // istalgan manzilni yuklab beradigan SSRF quroliga aylanadi.
    const base = env.ASSET_BASE_URL.replace(/\/+$/, '');
    if (!body.blobUrl.startsWith(`${base}/`)) {
      throw badRequest('Fayl manzili noto‘g‘ri');
    }

    if (body.kind === 'VIDEO') {
      const key = body.blobUrl.split('/').slice(-2).join('/');
      const media = await prisma.media.create({
        data: {
          kind: 'VIDEO',
          filename: key.replace(/\.[^.]+$/, ''),
          originalName: body.originalName.slice(0, 200),
          mimeType: body.blobUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4',
          width: body.width ?? 0,
          height: body.height ?? 0,
          sizeBytes: 0,
          variants: {},
          sourceUrl: body.blobUrl,
          durationSeconds: body.duration && body.duration > 0 ? body.duration : null,
          blurDataUrl: null,
          uploadedById: req.user?.sub ?? null,
        },
        select: mediaSelect,
      });
      await logAudit(req.user?.sub, 'media', media.id, 'upload', { kind: 'VIDEO' });
      return ok(res, [toMedia(media)!], 201);
    }

    const response = await fetch(body.blobUrl);
    if (!response.ok) throw badRequest('Yuklangan faylni o‘qib bo‘lmadi');
    const buffer = Buffer.from(await response.arrayBuffer());

    const processed = await processImage(buffer, body.originalName);
    const media = await prisma.media.create({
      data: {
        filename: processed.filename,
        originalName: body.originalName.slice(0, 200),
        mimeType: response.headers.get('content-type') ?? 'image/jpeg',
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
        variants: processed.variants as never,
        blurDataUrl: processed.blurDataUrl,
        uploadedById: req.user?.sub ?? null,
      },
      select: mediaSelect,
    });

    // Xom fayl endi keraksiz — variantlar yozilgan. Yiqilsa ham media
    // qatori yaratilgan, shuning uchun xatoni yutamiz.
    background(del(body.blobUrl), { blobUrl: body.blobUrl });

    await logAudit(req.user?.sub, 'media', media.id, 'upload', { count: 1 });
    return ok(res, [toMedia(media)!], 201);
  }),
);

adminMediaRouter.get(
  '/',
  validate(mediaQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, pageSize, kind } = validated<typeof mediaQuerySchema>(req);
    const where = kind ? { kind } : {};
    const [rows, total] = await Promise.all([
      prisma.media.findMany({
        where,
        select: mediaSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.media.count({ where }),
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
 * POST /api/admin/media/upload-video — bitta hero fon videosi.
 *
 * O'lchamlar va davomiylik brauzerda o'lchanib, matn maydonlari sifatida keladi:
 * serverda ffmpeg yo'q va qo'shilmaydi. Bu autentifikatsiyalangan admin
 * marshruti, eng yomon oqibat — admin ko'rinishida noto'g'ri nisbat.
 *
 * Javob RASM endpointi bilan bir xil — massiv — shunda `MediaPicker` da
 * javobni ajratib ishlash shart emas.
 */
adminMediaRouter.post(
  '/upload-video',
  uploadVideo.single('file'),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) throw badRequest('Video tanlanmadi');

    const body = req.body as Record<string, unknown> | undefined;
    const width = Math.max(0, Math.trunc(Number(body?.width) || 0));
    const height = Math.max(0, Math.trunc(Number(body?.height) || 0));
    const durationRaw = Math.trunc(Number(body?.duration) || 0);

    const stored = await storeVideo(file.buffer, file.originalname, file.mimetype);

    const media = await prisma.media.create({
      data: {
        kind: 'VIDEO',
        filename: stored.filename,
        originalName: file.originalname.slice(0, 200),
        mimeType: file.mimetype,
        width,
        height,
        sizeBytes: stored.sizeBytes,
        variants: {},
        sourceUrl: stored.sourceUrl,
        durationSeconds: durationRaw > 0 ? durationRaw : null,
        blurDataUrl: null,
        uploadedById: req.user?.sub ?? null,
      },
      select: mediaSelect,
    });

    await logAudit(req.user?.sub, 'media', media.id, 'upload', { kind: 'VIDEO' });
    return ok(res, [toMedia(media)!], 201);
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
    // Sozlamalardagi havola relationlarda ko'rinmaydi — JSON ichida yotadi.
    const heroBackground = (await isMediaUsedInSettings(row.id)) ? 1 : 0;
    return ok(res, {
      ...toMedia(row)!,
      originalName: row.originalName,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
      usage: {
        tourPosters: c.tourPosters,
        tourGallery: c.tourGallery,
        destinationHeros: c.destinationHeros,
        postCovers: c.postCovers,
        testimonials: c.testimonials,
        heroBackground,
        total:
          c.tourPosters +
          c.tourGallery +
          c.destinationHeros +
          c.postCovers +
          c.testimonials +
          heroBackground,
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
        kind: true,
        variants: true,
        sourceUrl: true,
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

    // Bosh sahifa foni sozlamalar JSON'ida yotadi — relation sanog'i uni ko'rmaydi.
    const inSettings = await isMediaUsedInSettings(media.id);

    // Ishlatilayotgan faylni o'chirish saytda "singan rasm" qoldiradi.
    if (used > 0 || inSettings) {
      const where =
        used > 0 && inSettings
          ? `${used} ta joyda va bosh sahifa fonida`
          : inSettings
            ? 'bosh sahifa fonida'
            : `${used} ta joyda`;
      throw conflict(`Bu fayl ${where} ishlatilmoqda. Avval u yerdan olib tashlang`);
    }

    await prisma.media.delete({ where: { id: media.id } });
    if (media.kind === 'VIDEO') {
      await deleteVideoFile(media.sourceUrl);
    } else {
      await deleteImageFiles(media.variants as MediaVariants);
    }
    await logAudit(req.user?.sub, 'media', media.id, 'delete');

    return ok(res, { id: media.id, deleted: true });
  }),
);
