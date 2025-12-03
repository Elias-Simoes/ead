import { z } from 'zod';

export const createAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
    type: z.enum(['multiple_choice', 'essay', 'mixed'], {
      errorMap: () => ({ message: 'Type must be multiple_choice, essay, or mixed' }),
    }),
  }),
});

export const createQuestionSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['multiple_choice', 'essay'], {
      errorMap: () => ({ message: 'Type must be multiple_choice or essay' }),
    }),
    options: z.array(z.string()).optional(),
    correct_answer: z.number().int().min(0).optional(),
    points: z.number().min(0, 'Points must be at least 0'),
    order_index: z.number().int().min(0, 'Order index must be at least 0'),
  }),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    text: z.string().min(1).optional(),
    options: z.array(z.string()).optional(),
    correct_answer: z.number().int().min(0).optional(),
    points: z.number().min(0).optional(),
    order_index: z.number().int().min(0).optional(),
  }),
});


export const submitAssessmentSchema = z.object({
  body: z.object({
    answers: z.array(
      z.object({
        question_id: z.string().uuid('Invalid question ID'),
        answer: z.union([z.string(), z.number()]),
      })
    ).min(1, 'At least one answer is required'),
  }),
});


export const gradeAssessmentSchema = z.object({
  body: z.object({
    score: z
      .number()
      .min(0, 'Score must be at least 0')
      .max(100, 'Score must be at most 100'),
    feedback: z.string().optional(),
  }),
});
