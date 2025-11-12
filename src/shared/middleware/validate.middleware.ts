import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '@shared/utils/logger';

/**
 * Middleware to validate request data using Zod schemas
 * @param schema - Zod schema to validate against
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation error', {
          path: req.path,
          errors,
        });

        res.status(422).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors,
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      logger.error('Unexpected validation error', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during validation',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  };
};
