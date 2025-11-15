import { z } from 'zod';

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    cover_image: z.string().optional(), // Aceita key ou URL
    category: z.string().max(100).optional(),
    workload: z.number().int().positive(),
  }),
});

export const updateCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    cover_image: z.string().optional(), // Aceita key ou URL
    category: z.string().max(100).optional(),
    workload: z.number().int().positive().optional(),
  }),
});

export const getCourseByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deleteCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listCoursesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const submitForApprovalSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const approveCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const rejectCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    reason: z.string().min(10).max(500),
  }),
});

export const listPublishedCoursesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    category: z.string().max(100).optional(),
    search: z.string().max(255).optional(),
  }),
});
