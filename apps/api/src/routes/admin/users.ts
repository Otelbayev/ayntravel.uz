import { Router } from 'express';
import argon2 from 'argon2';
import { createUserSchema, updateUserSchema } from '@ayntravel/shared';
import { prisma } from '../../db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/respond.js';
import { badRequest, notFound } from '../../utils/errors.js';
import { validate } from '../../middleware/validate.js';
import { toUser } from '../../services/dto.js';
import { revokeAllForUser } from '../../services/tokens.js';
import { logAudit } from '../../services/audit.js';

export const adminUsersRouter: Router = Router();

adminUsersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return ok(res, rows.map(toUser));
  }),
);

adminUsersRouter.post(
  '/',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const { email, name, password, role } = req.body as {
      email: string;
      name: string;
      password: string;
      role: 'ADMIN' | 'MANAGER';
    };
    const row = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        role,
        passwordHash: await argon2.hash(password),
      },
    });
    await logAudit(req.user?.sub, 'user', row.id, 'create', { email: row.email, role: row.role });
    return ok(res, toUser(row), 201);
  }),
);

adminUsersRouter.patch(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as Partial<{
      email: string;
      name: string;
      password: string;
      role: 'ADMIN' | 'MANAGER';
      isActive: boolean;
    }>;

    // O'zini o'chirib qo'yish yoki huquqini tushirib yuborishdan himoya:
    // aks holda tizimda hech qanday admin qolmasligi mumkin.
    if (req.params.id === req.user?.sub) {
      if (body.isActive === false) throw badRequest('O‘z hisobingizni bloklay olmaysiz');
      if (body.role && body.role !== 'ADMIN') {
        throw badRequest('O‘z rolingizni o‘zgartira olmaysiz');
      }
    }

    const data: Record<string, unknown> = { ...body };
    delete data.password;
    if (body.email) data.email = body.email.toLowerCase();
    if (body.password) data.passwordHash = await argon2.hash(body.password);

    const row = await prisma.user.update({ where: { id: req.params.id }, data });

    // Parol yoki holat o'zgarsa barcha sessiyalar yopiladi.
    if (body.password || body.isActive === false) await revokeAllForUser(row.id);

    await logAudit(req.user?.sub, 'user', row.id, 'update', Object.keys(body));
    return ok(res, toUser(row));
  }),
);

adminUsersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user?.sub) throw badRequest('O‘z hisobingizni o‘chira olmaysiz');

    const admins = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw notFound('Foydalanuvchi topilmadi');
    if (target.role === 'ADMIN' && admins <= 1) {
      throw badRequest('Tizimda kamida bitta admin qolishi kerak');
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    await logAudit(req.user?.sub, 'user', req.params.id, 'delete');
    return ok(res, { id: req.params.id, deleted: true });
  }),
);
