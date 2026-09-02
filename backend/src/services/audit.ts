import { prisma } from '../db.js';
import { logger } from '../logger.js';

/**
 * Kim nimani o'zgartirganini yozib boradi. Bir necha menejer ishlayotganda
 * "bu turni kim o'chirdi?" degan savolga javob beradi.
 *
 * Audit yozuvidagi xato asosiy amalni buzmasligi kerak — shuning uchun yutiladi.
 */
export async function logAudit(
  userId: string | undefined,
  entity: string,
  entityId: string | undefined,
  action: string,
  diff?: unknown,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        entity,
        entityId: entityId ?? null,
        action,
        diff: diff === undefined ? undefined : (JSON.parse(JSON.stringify(diff)) as never),
      },
    });
  } catch (err) {
    logger.warn({ err, entity, action }, 'Audit yozuvi saqlanmadi');
  }
}
