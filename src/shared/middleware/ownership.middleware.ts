import { Request, Response, NextFunction } from 'express';
import { logger } from '@shared/utils/logger';
import { pool } from '@config/database';

/**
 * Middleware to verify resource ownership
 * Checks if the authenticated user owns or has access to the requested resource
 */

/**
 * Verify that an instructor owns a specific course
 * Used to ensure instructors can only modify their own courses
 */
export const verifyInstructorCourseOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Admin can access all courses
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Only instructors can own courses
    if (req.user.role !== 'instructor') {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only instructors can access this resource',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Get course ID from params
    const courseId = req.params.id || req.params.courseId;

    if (!courseId) {
      res.status(400).json({
        error: {
          code: 'MISSING_COURSE_ID',
          message: 'Course ID is required',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Check if course exists and belongs to the instructor
    const result = await pool.query(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [courseId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: {
          code: 'COURSE_NOT_FOUND',
          message: 'Course not found',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const course = result.rows[0];

    if (course.instructor_id !== req.user.userId) {
      logger.warn('Ownership verification failed', {
        userId: req.user.userId,
        courseId,
        ownerId: course.instructor_id,
        path: req.path,
      });

      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this course',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Ownership verification error', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify resource ownership',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }
};

/**
 * Verify that a student is accessing their own profile
 * Used to ensure students can only access/modify their own data
 */
export const verifyStudentProfileOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  // Admin can access all profiles
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Students can only access their own profile
  if (req.user.role === 'student') {
    // For profile endpoints, the user is accessing their own data
    // No additional ID check needed as we use req.user.userId
    next();
    return;
  }

  res.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
};

/**
 * Verify that a user is accessing their own resource or is an admin
 * Generic ownership check for user-specific resources
 */
export const verifyUserOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  // Admin can access all resources
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Get user ID from params
  const userId = req.params.id || req.params.userId;

  // If no userId in params, assume user is accessing their own resource
  if (!userId) {
    next();
    return;
  }

  // Check if user is accessing their own resource
  if (userId !== req.user.userId) {
    logger.warn('User ownership verification failed', {
      authenticatedUserId: req.user.userId,
      requestedUserId: userId,
      path: req.path,
    });

    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  next();
};
