import { Router } from 'express';
import { assessmentController } from '../controllers/assessment.controller';
import { studentAssessmentController } from '../controllers/student-assessment.controller';
import { instructorAssessmentController } from '../controllers/instructor-assessment.controller';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { validate } from '@shared/middleware/validation.middleware';
import {
  createAssessmentSchema,
  createQuestionSchema,
  updateQuestionSchema,
  submitAssessmentSchema,
  gradeAssessmentSchema,
} from '../validators/assessment.validator';

const router = Router();

// Instructor routes - Create and manage assessments
router.post(
  '/courses/:id/assessments',
  authenticate,
  authorize('instructor'),
  validate(createAssessmentSchema),
  assessmentController.createAssessment.bind(assessmentController)
);

router.get(
  '/courses/:id/assessments',
  authenticate,
  authorize('instructor'),
  assessmentController.getCourseAssessments.bind(assessmentController)
);

router.get(
  '/assessments/:id',
  authenticate,
  assessmentController.getAssessment.bind(assessmentController)
);

router.patch(
  '/assessments/:id',
  authenticate,
  authorize('instructor'),
  assessmentController.updateAssessment.bind(assessmentController)
);

router.delete(
  '/assessments/:id',
  authenticate,
  authorize('instructor'),
  assessmentController.deleteAssessment.bind(assessmentController)
);

router.post(
  '/assessments/:id/questions',
  authenticate,
  authorize('instructor'),
  validate(createQuestionSchema),
  assessmentController.createQuestion.bind(assessmentController)
);

router.patch(
  '/questions/:id',
  authenticate,
  authorize('instructor'),
  validate(updateQuestionSchema),
  assessmentController.updateQuestion.bind(assessmentController)
);

router.delete(
  '/questions/:id',
  authenticate,
  authorize('instructor'),
  assessmentController.deleteQuestion.bind(assessmentController)
);

// Instructor routes - Grading
router.get(
  '/instructor/assessments/pending',
  authenticate,
  authorize('instructor'),
  instructorAssessmentController.getPendingAssessments.bind(instructorAssessmentController)
);

router.get(
  '/assessments/:id/submissions',
  authenticate,
  authorize('instructor'),
  instructorAssessmentController.getAssessmentSubmissions.bind(instructorAssessmentController)
);

router.patch(
  '/student-assessments/:id/grade',
  authenticate,
  authorize('instructor'),
  validate(gradeAssessmentSchema),
  instructorAssessmentController.gradeAssessment.bind(instructorAssessmentController)
);

// Student routes - Submit assessments
router.post(
  '/assessments/:id/submit',
  authenticate,
  authorize('student'),
  validate(submitAssessmentSchema),
  studentAssessmentController.submitAssessment.bind(studentAssessmentController)
);

export default router;
