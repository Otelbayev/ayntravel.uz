/** Boshqarilgan (kutilgan) xato — mijozga xabari ko'rsatiladi. */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, fields?: Record<string, string[]>) =>
  new AppError(400, 'BAD_REQUEST', message, fields);
export const unauthorized = (message = 'Avtorizatsiya talab qilinadi') =>
  new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Ruxsat yo‘q') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Topilmadi') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (message: string) => new AppError(409, 'CONFLICT', message);
export const tooMany = (message = 'Juda ko‘p so‘rov. Birozdan keyin urinib ko‘ring') =>
  new AppError(429, 'TOO_MANY_REQUESTS', message);
