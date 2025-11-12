import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: AppError | ZodError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));

    logger.warn('Validation error', {
      path: req.path,
      method: req.method,
      errors: validationErrors,
    });

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  // Handle custom app errors
  const appError = err as AppError;
  const statusCode = appError.statusCode || 500;
  const code = appError.code || 'INTERNAL_SERVER_ERROR';
  const message = appError.message || 'An unexpected error occurred';

  logger.error(`Error: ${message}`, {
    code,
    statusCode,
    path: req.path,
    method: req.method,
    stack: appError.stack,
  });

  res.status(statusCode).json({
    error: {
      code,
      message,
      details: appError.details,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
};
