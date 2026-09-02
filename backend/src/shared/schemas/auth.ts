import { z } from 'zod';
import { USER_ROLES } from '../enums.js';

export const loginSchema = z.object({
  email: z.string().email('Email noto‘g‘ri').max(200),
  password: z.string().min(8, 'Parol kamida 8 belgidan iborat bo‘lsin').max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(8, 'Parol kamida 8 belgidan iborat bo‘lsin').max(200),
  role: z.enum(USER_ROLES).default('MANAGER'),
});

export const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Yangi parol kamida 8 belgi').max(200),
});
