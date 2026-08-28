import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 async route'lardagi rejected promise'ni o'zi ushlamaydi —
 * shu wrapper bo'lmasa xato error middleware'ga yetib bormaydi.
 */
export const asyncHandler =
  <T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    void fn(req as T, res, next).catch(next);
  };
