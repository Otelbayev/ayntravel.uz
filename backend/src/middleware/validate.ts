import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { AppError } from '../utils/errors.js';

type Target = 'body' | 'query' | 'params';

/** Zod xatolarini maydon → xabarlar ko'rinishiga aylantiradi (formada ko'rsatish uchun). */
export function zodFields(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

/**
 * So'rovni tekshiradi va **tozalangan** qiymatni qaytadan yozadi, shunda
 * route ichida `req.body` allaqachon transform qilingan bo'ladi
 * (masalan telefon +998... formatiga keltirilgan).
 */
export function validate<S extends ZodTypeAny>(schema: S, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const fields = zodFields(result.error);
      const first = result.error.issues[0]?.message ?? 'Ma’lumot noto‘g‘ri';
      return next(new AppError(400, 'VALIDATION_ERROR', first, fields));
    }
    if (target === 'query') {
      // Express 5 da req.query faqat o'qish uchun — alohida joyda saqlaymiz.
      (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    } else {
      req[target] = result.data as never;
    }
    next();
  };
}

/** Validatsiyadan o'tgan query'ni tiplangan holda olish. */
export function validated<S extends ZodTypeAny>(req: Request): z.infer<S> {
  return (req as Request & { validatedQuery?: unknown }).validatedQuery as z.infer<S>;
}
