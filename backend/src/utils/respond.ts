import type { Response } from 'express';
import type { Paginated } from '../shared/index.js';

/** API javoblari doim { ok, data } / { ok, error } konvertida bo'ladi. */
export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function paginate<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
