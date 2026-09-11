import { Router, type Request } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';
import { paginationSchema } from '../../shared/index.js';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, paginate } from '../../utils/respond.js';
import { notFound } from '../../utils/errors.js';
import { validate, validated } from '../../middleware/validate.js';
import { localizedPaths, revalidate } from '../../services/revalidate.js';
import { logAudit } from '../../services/audit.js';
import { background } from '../../utils/background.js';

/** Prisma delegate'ining bizga kerakli minimal qismi. */
interface Delegate {
  findMany(args?: unknown): Promise<unknown[]>;
  findUnique(args: unknown): Promise<unknown>;
  count(args?: unknown): Promise<number>;
  create(args: unknown): Promise<{ id: string }>;
  update(args: unknown): Promise<{ id: string }>;
  delete(args: unknown): Promise<unknown>;
}

interface CrudOptions<T> {
  /** Prisma modeli nomi — audit log va delegate uchun. */
  model: keyof typeof prisma & string;
  /** Yaratishda ishlatiladigan to'liq sxema. */
  schema: AnyZodObject;
  /** PATCH uchun sxema. Berilmasa `schema.partial()` ishlatiladi. */
  updateSchema?: ZodTypeAny;
  include?: unknown;
  orderBy?: unknown;
  /** Prisma yozuvini API javobiga o'giradi. */
  toDto: (row: never) => T;
  /** Nashr qilinganda qaysi kesh teglari yangilanadi. */
  cacheTags?: string[];
  /**
   * Qo'shimcha aniq manzillar (teglardan tashqari).
   * Masalan xizmatlar `/uz/xizmatlar` sahifasida ham ko'rinadi.
   */
  cachePaths?: string[];
  /** Yozishdan oldin ma'lumotni tayyorlash (masalan slug generatsiyasi). */
  beforeWrite?: (data: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Bir xil ko'rinishdagi modellar (xizmatlar, FAQ, fikrlar, sahifalar) uchun
 * umumiy CRUD. Turlar va postlar o'z fayllarida — ularda qo'shimcha mantiq bor.
 */
export function createCrudRouter<T>(opts: CrudOptions<T>): Router {
  const router: Router = Router();
  const delegate = prisma[opts.model] as unknown as Delegate;
  // PATCH da barcha maydonlar ixtiyoriy: admin bitta bayroqni ham o'zgartira oladi.
  const patchSchema = opts.updateSchema ?? opts.schema.partial();

  /*
   * Keshni yangilash: teglar (ma'lumot keshi) VA aniq manzillar (marshrut keshi).
   *
   * Faqat teg yuborish yetarli emas edi: `/uz/xizmatlar` kabi oldindan
   * chizilgan sahifalarning marshrut keshi teg bo'yicha tozalanmaydi, shuning
   * uchun yangi xizmat qo'shilsa ham sahifa eski holida qolib ketardi.
   */
  const touch = () =>
    revalidate({
      tags: opts.cacheTags ?? [],
      paths: [...localizedPaths.lists(), ...(opts.cachePaths ?? [])],
    });

  router.get(
    '/',
    validate(paginationSchema, 'query'),
    asyncHandler(async (req: Request, res) => {
      const { page, pageSize } = validated<typeof paginationSchema>(req);
      const [rows, total] = await Promise.all([
        delegate.findMany({
          include: opts.include,
          orderBy: opts.orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        delegate.count(),
      ]);
      return ok(res, paginate(rows.map((r) => opts.toDto(r as never)), total, page, pageSize));
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const row = await delegate.findUnique({ where: { id: req.params.id }, include: opts.include });
      if (!row) throw notFound();
      return ok(res, opts.toDto(row as never));
    }),
  );

  router.post(
    '/',
    validate(opts.schema),
    asyncHandler(async (req, res) => {
      const data = opts.beforeWrite ? opts.beforeWrite(req.body) : req.body;
      const row = await delegate.create({ data, include: opts.include });
      await logAudit(req.user?.sub, opts.model, row.id, 'create', data);
      background(touch());
      return ok(res, opts.toDto(row as never), 201);
    }),
  );

  router.patch(
    '/:id',
    validate(patchSchema),
    asyncHandler(async (req, res) => {
      const data = opts.beforeWrite ? opts.beforeWrite(req.body) : req.body;
      const row = await delegate.update({
        where: { id: req.params.id },
        data,
        include: opts.include,
      });
      await logAudit(req.user?.sub, opts.model, req.params.id, 'update', data);
      background(touch());
      return ok(res, opts.toDto(row as never));
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await delegate.delete({ where: { id: req.params.id } });
      await logAudit(req.user?.sub, opts.model, req.params.id, 'delete');
      background(touch());
      return ok(res, { id: req.params.id, deleted: true });
    }),
  );

  return router;
}
