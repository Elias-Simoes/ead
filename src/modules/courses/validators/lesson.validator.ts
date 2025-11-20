import { z } from 'zod';

export const createLessonSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      title: z.string().min(3).max(255),
      description: z.string().optional(),
      // Old format (for backward compatibility)
      type: z.enum(['video', 'pdf', 'text', 'external_link']).optional(),
      content: z.string().optional(),
      // New format (multiple content types)
      video_url: z
        .union([z.string().url(), z.literal(''), z.null()])
        .optional(),
      video_file_key: z.string().nullable().optional(),
      text_content: z.string().nullable().optional(),
      pdf_file_key: z.string().nullable().optional(),
      pdf_url: z
        .union([z.string().url(), z.literal(''), z.null()])
        .optional(),
      external_link: z
        .union([z.string().url(), z.literal(''), z.null()])
        .optional(),
      duration: z.number().int().nonnegative().optional(),
      order_index: z.number().int().nonnegative().optional(),
    })
    .refine(
      (data) => {
        // At least one content type must be provided
        return (
          data.content ||
          (data.video_url && data.video_url !== '') ||
          data.text_content ||
          (data.external_link && data.external_link !== '') ||
          (data.pdf_url && data.pdf_url !== '')
        );
      },
      {
        message: 'At least one content type must be provided',
      }
    ),
});

export const updateLessonSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional(),
    // Old format (for backward compatibility)
    type: z.enum(['video', 'pdf', 'text', 'external_link']).optional(),
    content: z.string().optional(),
    // New format (multiple content types)
    video_url: z
      .union([z.string().url(), z.literal(''), z.null()])
      .optional(),
    video_file_key: z.string().nullable().optional(),
    text_content: z.string().nullable().optional(),
    pdf_file_key: z.string().nullable().optional(),
    pdf_url: z
      .union([z.string().url(), z.literal(''), z.null()])
      .optional(),
    external_link: z
      .union([z.string().url(), z.literal(''), z.null()])
      .optional(),
    duration: z.number().int().positive().optional(),
    order_index: z.number().int().nonnegative().optional(),
  }),
});

export const deleteLessonSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
