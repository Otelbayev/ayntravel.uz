import { Router } from 'express';
import { siteSettingsBulkSchema } from '@ayntravel/shared';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/respond.js';
import { validate } from '../../middleware/validate.js';
import { getSettings, updateSettings } from '../../services/settings.js';
import { CacheTags, revalidatePaths } from '../../services/revalidate.js';
import { logAudit } from '../../services/audit.js';

export const adminSettingsRouter: Router = Router();

adminSettingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => ok(res, await getSettings())),
);

/** PUT /api/admin/settings — bir nechta kalitni bir vaqtda yangilaydi. */
adminSettingsRouter.put(
  '/',
  validate(siteSettingsBulkSchema),
  asyncHandler(async (req, res) => {
    const settings = await updateSettings(req.body as Record<string, unknown>);
    await logAudit(req.user?.sub, 'settings', undefined, 'update', Object.keys(req.body));
    // Sozlamalar footer/headerda — butun saytni yangilash kerak.
    void revalidatePaths(Object.values(CacheTags));
    return ok(res, settings);
  }),
);
