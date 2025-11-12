import { z } from 'zod';

export const createLessonSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    type: z.enum(['video', 'pdf', 'text', 'external_link']),
    content: z.string().min(1),
    duration: z.number().int().positive().optional(),
    order_index: z.number().int().nonnegative().optional(),
  }),
});

export const updateLessonSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    type: z.enum(['video', 'pdf', 'text', 'external_link']).optional(),
    content: z.string().min(1).optional(),
    duration: z.number().int().positive().optional(),
    order_index: z.number().int().nonnegative().optional(),
  }),
});

export const deleteLessonSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
