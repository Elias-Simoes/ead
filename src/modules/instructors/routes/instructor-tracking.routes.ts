import { Router } from 'express';
import { instructorTrackingController } from '../controllers/instructor-tracking.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';

const router = Router();

// All routes require authentication and instructor role
router.use(authenticate);
router.use(authorize('instructor'));

/**
 * GET /api/instructor/dashboard
 * Get instructor dashboard with metrics
 */
router.get('/dashboard', instructorTrackingController.getDashboard.bind(instructorTrackingController));

/**
 * GET /api/instructor/courses
 * Get all courses for the authenticated instructor
 */
router.get('/courses', instructorTrackingController.getInstructorCourses.bind(instructorTrackingController));

/**
 * GET /api/instructor/courses/:id/students
 * Get all students enrolled in a course
 */
router.get(
  '/courses/:id/students',
  instructorTrackingController.getEnrolledStudents.bind(instructorTrackingController)
);

/**
 * GET /api/instructor/students/:id/progress/:courseId
 * Get detailed progress for a specific student in a course
 */
router.get(
  '/students/:id/progress/:courseId',
  instructorTrackingController.getStudentDetailedProgress.bind(instructorTrackingController)
);

export default router;
