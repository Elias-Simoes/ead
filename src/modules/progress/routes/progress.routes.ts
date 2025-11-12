import { Router } from 'express';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { requireActiveSubscription } from '@shared/middleware/subscription.middleware';
import { courseAccessController } from '../controllers/course-access.controller';
import { progressController } from '../controllers/progress.controller';

const router = Router();

/**
 * Course Access Routes
 * These routes allow students to access course content
 */

// GET /api/courses/:id/content - Get course content with modules and lessons
router.get(
  '/courses/:id/content',
  authenticate,
  requireActiveSubscription,
  courseAccessController.getCourseContent.bind(courseAccessController)
);

// GET /api/lessons/:id/content - Get lesson content with signed URL for videos
router.get(
  '/lessons/:id/content',
  authenticate,
  requireActiveSubscription,
  courseAccessController.getLessonContent.bind(courseAccessController)
);

/**
 * Progress Management Routes
 * These routes allow students to track and manage their progress
 */

// POST /api/courses/:courseId/progress - Mark a lesson as completed
router.post(
  '/courses/:courseId/progress',
  authenticate,
  authorize('student'),
  requireActiveSubscription,
  progressController.markLessonCompleted.bind(progressController)
);

// GET /api/students/courses/progress - Get all progress for the authenticated student
router.get(
  '/students/courses/progress',
  authenticate,
  authorize('student'),
  progressController.getStudentProgress.bind(progressController)
);

// PATCH /api/courses/:id/favorite - Toggle favorite status for a course
router.patch(
  '/courses/:id/favorite',
  authenticate,
  authorize('student'),
  progressController.toggleFavorite.bind(progressController)
);

// GET /api/students/courses/history - Get student course history
router.get(
  '/students/courses/history',
  authenticate,
  authorize('student'),
  progressController.getStudentHistory.bind(progressController)
);

export default router;
