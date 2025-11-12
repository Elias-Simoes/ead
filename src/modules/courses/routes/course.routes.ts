import { Router } from 'express';
import { courseController } from '../controllers/course.controller';
import { moduleController } from '../controllers/module.controller';
import { lessonController } from '../controllers/lesson.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validate.middleware';
import {
  createCourseSchema,
  updateCourseSchema,
  getCourseByIdSchema,
  deleteCourseSchema,
  listCoursesSchema,
  submitForApprovalSchema,
  approveCourseSchema,
  rejectCourseSchema,
  listPublishedCoursesSchema,
} from '../validators/course.validator';
import {
  createModuleSchema,
  updateModuleSchema,
  deleteModuleSchema,
} from '../validators/module.validator';
import {
  createLessonSchema,
  updateLessonSchema,
  deleteLessonSchema,
} from '../validators/lesson.validator';

const router = Router();

/**
 * @route   GET /api/courses
 * @desc    Get published courses with filters
 * @access  Public (authenticated)
 */
router.get(
  '/',
  authenticate,
  validate(listPublishedCoursesSchema),
  courseController.getPublishedCourses.bind(courseController)
);

/**
 * @route   POST /api/courses
 * @desc    Create a new course (draft)
 * @access  Instructor only
 */
router.post(
  '/',
  authenticate,
  authorize('instructor'),
  validate(createCourseSchema),
  courseController.createCourse.bind(courseController)
);

/**
 * @route   GET /api/courses/:id
 * @desc    Get course by ID with full details
 * @access  Authenticated users (with permission checks)
 */
router.get(
  '/:id',
  authenticate,
  validate(getCourseByIdSchema),
  courseController.getCourseById.bind(courseController)
);

/**
 * @route   PATCH /api/courses/:id
 * @desc    Update course
 * @access  Instructor (owner only)
 */
router.patch(
  '/:id',
  authenticate,
  authorize('instructor'),
  validate(updateCourseSchema),
  courseController.updateCourse.bind(courseController)
);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course (only draft)
 * @access  Instructor (owner only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('instructor'),
  validate(deleteCourseSchema),
  courseController.deleteCourse.bind(courseController)
);

/**
 * @route   GET /api/instructor/courses
 * @desc    Get instructor's courses
 * @access  Instructor only
 */
router.get(
  '/instructor/my-courses',
  authenticate,
  authorize('instructor'),
  validate(listCoursesSchema),
  courseController.getInstructorCourses.bind(courseController)
);

/**
 * @route   POST /api/courses/:id/submit
 * @desc    Submit course for approval
 * @access  Instructor (owner only)
 */
router.post(
  '/:id/submit',
  authenticate,
  authorize('instructor'),
  validate(submitForApprovalSchema),
  courseController.submitForApproval.bind(courseController)
);

/**
 * @route   GET /api/admin/courses/pending
 * @desc    Get courses pending approval
 * @access  Admin only
 */
router.get(
  '/admin/pending',
  authenticate,
  authorize('admin'),
  validate(listCoursesSchema),
  courseController.getPendingCourses.bind(courseController)
);

/**
 * @route   PATCH /api/admin/courses/:id/approve
 * @desc    Approve a course
 * @access  Admin only
 */
router.patch(
  '/admin/:id/approve',
  authenticate,
  authorize('admin'),
  validate(approveCourseSchema),
  courseController.approveCourse.bind(courseController)
);

/**
 * @route   PATCH /api/admin/courses/:id/reject
 * @desc    Reject a course
 * @access  Admin only
 */
router.patch(
  '/admin/:id/reject',
  authenticate,
  authorize('admin'),
  validate(rejectCourseSchema),
  courseController.rejectCourse.bind(courseController)
);

// Module routes

/**
 * @route   POST /api/courses/:id/modules
 * @desc    Add a module to a course
 * @access  Instructor (owner only)
 */
router.post(
  '/:id/modules',
  authenticate,
  authorize('instructor'),
  validate(createModuleSchema),
  moduleController.createModule.bind(moduleController)
);

/**
 * @route   PATCH /api/modules/:id
 * @desc    Update a module
 * @access  Instructor (owner only)
 */
router.patch(
  '/modules/:id',
  authenticate,
  authorize('instructor'),
  validate(updateModuleSchema),
  moduleController.updateModule.bind(moduleController)
);

/**
 * @route   DELETE /api/modules/:id
 * @desc    Delete a module
 * @access  Instructor (owner only)
 */
router.delete(
  '/modules/:id',
  authenticate,
  authorize('instructor'),
  validate(deleteModuleSchema),
  moduleController.deleteModule.bind(moduleController)
);

// Lesson routes

/**
 * @route   POST /api/modules/:id/lessons
 * @desc    Add a lesson to a module
 * @access  Instructor (owner only)
 */
router.post(
  '/modules/:id/lessons',
  authenticate,
  authorize('instructor'),
  validate(createLessonSchema),
  lessonController.createLesson.bind(lessonController)
);

/**
 * @route   PATCH /api/lessons/:id
 * @desc    Update a lesson
 * @access  Instructor (owner only)
 */
router.patch(
  '/lessons/:id',
  authenticate,
  authorize('instructor'),
  validate(updateLessonSchema),
  lessonController.updateLesson.bind(lessonController)
);

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete a lesson
 * @access  Instructor (owner only)
 */
router.delete(
  '/lessons/:id',
  authenticate,
  authorize('instructor'),
  validate(deleteLessonSchema),
  lessonController.deleteLesson.bind(lessonController)
);

export default router;
