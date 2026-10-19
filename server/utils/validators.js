import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email(),
  password: z.string().min(6).max(60),
});

export const personSchema = z.object({
  name: z.string().trim().min(2).max(60),
  relation: z.string().trim().min(2).max(40),
  dob: z.string().optional().nullable(),
});

export const nomineeSchema = z.object({
  name: z.string().trim().min(2).max(60).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  delayDays: z.coerce.number().int().min(1).max(365).optional(),
  waitDays: z.coerce.number().int().min(1).max(30).optional(),
});

export const confirmSchema = z.object({
  type: z.string().min(1).max(40),
  extracted: z.object({}).passthrough(),
});
