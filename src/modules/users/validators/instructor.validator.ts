import { z } from 'zod';

/**
 * Validation schema for creating an instructor
 */
export const createInstructorSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters'),
    bio: z
      .string()
      .max(2000, 'Bio must not exceed 2000 characters')
      .optional(),
    expertise: z
      .array(z.string())
      .max(10, 'Maximum 10 expertise areas allowed')
      .optional(),
  }),
});

/**
 * Validation schema for suspending/reactivating an instructor
 */
export const toggleSuspensionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid instructor ID format'),
  }),
  body: z.object({
    suspend: z.boolean({
      required_error: 'Suspend field is required',
      invalid_type_error: 'Suspend must be a boolean',
    }),
  }),
});

/**
 * Validation schema for getting instructor by ID
 */
export const getInstructorByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid instructor ID format'),
  }),
});

/**
 * Validation schema for listing instructors with pagination
 */
export const listInstructorsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  }),
});

export type CreateInstructorInput = z.infer<typeof createInstructorSchema>;
export type ToggleSuspensionInput = z.infer<typeof toggleSuspensionSchema>;
export type GetInstructorByIdInput = z.infer<typeof getInstructorByIdSchema>;
export type ListInstructorsInput = z.infer<typeof listInstructorsSchema>;
