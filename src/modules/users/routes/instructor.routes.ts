import { Router } from 'express';
import { instructorController } from '../controllers/instructor.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validate.middleware';
import {
  createInstructorSchema,
  toggleSuspensionSchema,
  getInstructorByIdSchema,
  listInstructorsSchema,
} from '../validators/instructor.validator';

const router = Router();

/**
 * All instructor management routes require admin authentication
 */

/**
 * @route   POST /api/admin/instructors
 * @desc    Create a new instructor
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createInstructorSchema),
  instructorController.createInstructor.bind(instructorController)
);

/**
 * @route   GET /api/admin/instructors
 * @desc    Get all instructors with pagination
 * @access  Admin only
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(listInstructorsSchema),
  instructorController.getInstructors.bind(instructorController)
);

/**
 * @route   GET /api/admin/instructors/:id
 * @desc    Get instructor by ID
 * @access  Admin only
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(getInstructorByIdSchema),
  instructorController.getInstructorById.bind(instructorController)
);

/**
 * @route   PATCH /api/admin/instructors/:id/suspend
 * @desc    Suspend or reactivate an instructor
 * @access  Admin only
 */
router.patch(
  '/:id/suspend',
  authenticate,
  authorize('admin'),
  validate(toggleSuspensionSchema),
  instructorController.toggleSuspension.bind(instructorController)
);

export default router;
