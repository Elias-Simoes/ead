import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { verifyStudentProfileOwnership } from '@shared/middleware/ownership.middleware';
import { validate } from '@shared/middleware/validate.middleware';
import { updateStudentProfileSchema } from '../validators/student.validator';

const router = Router();

/**
 * All student profile routes require student authentication
 */

/**
 * @route   GET /api/students/profile
 * @desc    Get student profile
 * @access  Student only (own profile)
 */
router.get(
  '/profile',
  authenticate,
  authorize('student'),
  verifyStudentProfileOwnership,
  studentController.getProfile.bind(studentController)
);

/**
 * @route   PATCH /api/students/profile
 * @desc    Update student profile
 * @access  Student only (own profile)
 */
router.patch(
  '/profile',
  authenticate,
  authorize('student'),
  verifyStudentProfileOwnership,
  validate(updateStudentProfileSchema),
  studentController.updateProfile.bind(studentController)
);

export default router;
