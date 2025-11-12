import { z } from 'zod';

/**
 * Validation schema for updating student profile
 */
export const updateStudentProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .optional(),
  }),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
