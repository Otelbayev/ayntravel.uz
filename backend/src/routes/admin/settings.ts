import { Router } from 'express';
import { siteSettingsBulkSchema } from '../../shared/index.js';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/respond.js';
import { badRequest } from '../../utils/errors.js';
import { validate } from '../../middleware/validate.js';
import {
  getSettingsResolved,
  heroMediaIdsOf,
  normalizeHeroBackground,
  updateSettings,
} from '../../services/settings.js';
import { CacheTags, revalidatePaths } from '../../services/revalidate.js';
import { logAudit } from '../../services/audit.js';
import { background } from '../../utils/background.js';

export const adminSettingsRouter: Router = Router();

/**
 * Admin formasi ham xom id'larni (tahrirlash uchun), ham kengaytirilgan
 * media obyektlarini (thumbnail uchun) bitta so'rovda oladi.
 */
adminSettingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => ok(res, await getSettingsResolved())),
);

/**
 * Hero fonidagi media id'lari haqiqatan mavjudmi va turi to'g'rimi.
 *
 * Sozlama JSON'i tashqi kalit emas, shuning uchun tekshiruv shu yerda —
 * bo'lmasa o'chirilgan yoki noto'g'ri turdagi media jimgina saqlanib ketardi.
 */
async function assertHeroMediaValid(raw: unknown): Promise<void> {
  const cfg = normalizeHeroBackground(raw);
  const ids = heroMediaIdsOf(cfg);
  if (ids.length === 0) return;

  const rows = await prisma.media.findMany({
    where: { id: { in: ids } },
    select: { id: true, kind: true },
  });
  const kindById = new Map(rows.map((r) => [r.id, r.kind]));

  if (ids.some((id) => !kindById.has(id))) {
    throw badRequest('Tanlangan media topilmadi — u o‘chirilgan bo‘lishi mumkin');
  }
  if (cfg.videoMediaId && kindById.get(cfg.videoMediaId) !== 'VIDEO') {
    throw badRequest('Video maydoniga rasm tanlangan');
  }
  if (cfg.slideIds.some((id) => kindById.get(id) !== 'IMAGE')) {
    throw badRequest('Slaydlar faqat rasm bo‘lishi mumkin');
  }
  if (cfg.videoPosterId && kindById.get(cfg.videoPosterId) !== 'IMAGE') {
    throw badRequest('Video posteri rasm bo‘lishi kerak');
  }
}

/** PUT /api/admin/settings — bir nechta kalitni bir vaqtda yangilaydi. */
adminSettingsRouter.put(
  '/',
  validate(siteSettingsBulkSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as Record<string, unknown>;
    if (body.heroBackground !== undefined) await assertHeroMediaValid(body.heroBackground);

    const settings = await updateSettings(body);
    await logAudit(req.user?.sub, 'settings', undefined, 'update', Object.keys(body));
    // Sozlamalar footer/headerda — butun saytni yangilash kerak.
    background(revalidatePaths(Object.values(CacheTags)));
    return ok(res, settings);
  }),
);
