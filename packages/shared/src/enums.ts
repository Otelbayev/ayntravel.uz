/**
 * Prisma enum'lari bilan bir xil qiymatlar. Shu yerda takrorlanadi, chunki
 * frontend Prisma client'ni import qilmaydi (va qilmasligi kerak).
 */
export const USER_ROLES = ['ADMIN', 'MANAGER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** Lid hayot sikli: yangi → bog'lanildi → sotildi / yo'qotildi. */
export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'BOOKED', 'LOST', 'SPAM'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Ovqatlanish turi — turizmda standart qisqartmalar. */
export const MEAL_PLANS = ['RO', 'BB', 'HB', 'FB', 'AI', 'UAI'] as const;
export type MealPlan = (typeof MEAL_PLANS)[number];

export const MEAL_PLAN_LABELS: Record<MealPlan, { uz: string; ru: string }> = {
  RO: { uz: 'Ovqatsiz', ru: 'Без питания' },
  BB: { uz: 'Nonushta', ru: 'Завтрак' },
  HB: { uz: 'Yarim pansion', ru: 'Полупансион' },
  FB: { uz: 'To‘liq pansion', ru: 'Полный пансион' },
  AI: { uz: 'Hammasi kiritilgan', ru: 'Всё включено' },
  UAI: { uz: 'Ultra all inclusive', ru: 'Ultra all inclusive' },
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, { uz: string; ru: string }> = {
  NEW: { uz: 'Yangi', ru: 'Новая' },
  CONTACTED: { uz: 'Bog‘lanildi', ru: 'Связались' },
  BOOKED: { uz: 'Band qilindi', ru: 'Забронировано' },
  LOST: { uz: 'Yo‘qotildi', ru: 'Потеряна' },
  SPAM: { uz: 'Spam', ru: 'Спам' },
};
