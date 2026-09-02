import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createLeadSchema } from '../../shared/index.js';
import { env } from '../../env.js';
import { prisma } from '../../db.js';
import { logger } from '../../logger.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/respond.js';
import { badRequest } from '../../utils/errors.js';
import { validate } from '../../middleware/validate.js';
import { notifyNewLead } from '../../services/telegram.js';

export const leadsRouter: Router = Router();

/** Xom IP saqlanmaydi — faqat tuzlangan hash (rate limit va spam tahlili uchun yetarli). */
function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return crypto.createHmac('sha256', env.IP_HASH_SALT).update(ip).digest('hex').slice(0, 32);
}

/**
 * Bitta IP soatiga 5 ta **muvaffaqiyatli** ariza yubora oladi.
 *
 * `skipFailedRequests` juda muhim: usiz telefon raqamini bir necha marta
 * xato terganda ham hisob to'lib qolardi va haqiqiy mijoz bir soatga
 * bloklanardi — ya'ni biz o'z lidimizni yo'qotardik. Endi faqat bazaga
 * yozilgan arizalar sanaladi, xato to'ldirishlar cheklovga ta'sir qilmaydi.
 * Botga qarshi himoya saqlanadi: u ham 5 tadan ortiq ariza yubora olmaydi.
 */
const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipFailedRequests: true,
  message: {
    ok: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Juda ko‘p ariza yubordingiz. Iltimos, biroz kuting yoki telefon qiling',
    },
  },
});

/** Forma chizilgandan keyin kamida shuncha vaqt o'tishi kerak (bot juda tez to'ldiradi). */
const MIN_FILL_MS = 2500;

/** POST /api/leads — saytdagi barcha formalar shu yerga yuboriladi. */
leadsRouter.post(
  '/',
  leadLimiter,
  validate(createLeadSchema),
  asyncHandler(async (req, res) => {
    const payload = req.body as import('../../shared/index.js').CreateLeadPayload;

    // Honeypot maydoni schema darajasida ham tekshiriladi; bu yerda qo'shimcha
    // vaqt tekshiruvi — forma ochilishi bilan yuborilgan so'rov bot deb sanaladi.
    if (payload.renderedAt && Date.now() - payload.renderedAt < MIN_FILL_MS) {
      logger.warn({ ip: hashIp(req.ip) }, 'Lid juda tez yuborildi — spam deb rad etildi');
      throw badRequest('Ariza juda tez yuborildi. Iltimos, qaytadan urinib ko‘ring');
    }

    // Turni tekshiramiz: mavjud bo'lmagan id kelsa bog'lamasdan saqlaymiz,
    // ariza baribir yo'qolmasligi kerak.
    let tourId: string | null = null;
    let tourTitle: string | null = null;
    let tourSlug: string | null = null;
    if (payload.tourId) {
      const tour = await prisma.tour.findUnique({
        where: { id: payload.tourId },
        select: { id: true, titleUz: true, slug: true },
      });
      if (tour) {
        tourId = tour.id;
        tourTitle = tour.titleUz;
        tourSlug = tour.slug;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        message: payload.message || null,
        source: payload.source,
        locale: payload.locale,
        tourId,
        utm: payload.utm && Object.keys(payload.utm).length > 0 ? payload.utm : undefined,
        ipHash: hashIp(req.ip),
        userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      },
    });

    logger.info({ leadId: lead.id, source: lead.source, tourId }, 'Yangi lid qabul qilindi');

    // Mijozga darhol javob qaytaramiz — Telegram sekin ishlasa ham forma tez yopiladi.
    ok(res, { id: lead.id, message: 'Arizangiz qabul qilindi' }, 201);

    // Xabar fonda yuboriladi va natijasi bazaga yoziladi.
    void notifyNewLead({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      message: lead.message,
      source: lead.source,
      locale: lead.locale,
      tourTitle,
      tourSlug,
      utm: lead.utm as Record<string, unknown> | null,
      createdAt: lead.createdAt,
    })
      .then((sent) => {
        if (sent) {
          return prisma.lead.update({
            where: { id: lead.id },
            data: { notifiedAt: new Date() },
          });
        }
        return undefined;
      })
      .catch((err) => logger.error({ err, leadId: lead.id }, 'Xabar yuborishda xato'));
  }),
);
