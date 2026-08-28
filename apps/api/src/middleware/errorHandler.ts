import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/errors.js';
import { zodFields } from './validate.js';
import { logger } from '../logger.js';
import { isProd } from '../env.js';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Endpoint topilmadi' } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ ok: false, error: { code: err.code, message: err.message, fields: err.fields } });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri',
        fields: zodFields(err),
      },
    });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Fayl hajmi juda katta' : 'Faylni yuklab bo‘lmadi';
    return res.status(400).json({ ok: false, error: { code: err.code, message } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 — unique cheklov buzildi (odatda slug takrorlangan).
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'qiymat';
      return res.status(409).json({
        ok: false,
        error: { code: 'CONFLICT', message: `Bunday ${target} allaqachon mavjud` },
      });
    }
    if (err.code === 'P2025') {
      return res
        .status(404)
        .json({ ok: false, error: { code: 'NOT_FOUND', message: 'Yozuv topilmadi' } });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        ok: false,
        error: { code: 'FK_CONSTRAINT', message: 'Bu yozuv boshqa ma’lumotlarga bog‘langan' },
      });
    }
  }

  logger.error({ err, url: req.originalUrl, method: req.method }, 'Kutilmagan server xatosi');

  res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Serverda xatolik yuz berdi' : String((err as Error)?.message ?? err),
    },
  });
}
