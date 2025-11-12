import { z } from 'zod';

export const createModuleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    order_index: z.number().int().nonnegative().optional(),
  }),
});

export const updateModuleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    order_index: z.number().int().nonnegative().optional(),
  }),
});

export const deleteModuleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
