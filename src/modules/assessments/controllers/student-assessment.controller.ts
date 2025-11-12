import { Request, Response } from 'express';
import { studentAssessmentService } from '../services/student-assessment.service';
import { assessmentService } from '../services/assessment.service';
import { logger } from '@shared/utils/logger';

export class StudentAssessmentController {
  /**
   * Get assessment for student to view (without correct answers)
   * GET /api/assessments/:id
   */
  async getAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id: assessmentId } = req.params;
      const studentId = req.user!.userId;

      const assessment = await assessmentService.getAssessmentWithQuestions(assessmentId);

      if (!assessment) {
        res.status(404).json({
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if student has already submitted
      const hasSubmitted = await studentAssessmentService.hasSubmitted(studentId, assessmentId);

      // Remove correct answers from questions for students
      const sanitizedQuestions = assessment.questions.map((q: any) => {
        const { correct_answer, ...rest } = q;
        return rest;
      });

      res.status(200).json({
        message: 'Assessment retrieved successfully',
        data: {
          assessment: {
            ...assessment,
            questions: sanitizedQuestions,
          },
          hasSubmitted,
        },
      });
    } catch (error) {
      logger.error('Failed to get assessment', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve assessment',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Submit assessment answers
   * POST /api/assessments/:id/submit
   */
  async submitAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id: assessmentId } = req.params;
      const { answers } = req.body;
      const studentId = req.user!.userId;

      // Check if assessment exists
      const assessment = await assessmentService.getAssessmentById(assessmentId);
      if (!assessment) {
        res.status(404).json({
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: 'Assessment not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const submission = await studentAssessmentService.submitAssessment({
        student_id: studentId,
        assessment_id: assessmentId,
        answers,
      });

      res.status(201).json({
        message: 'Assessment submitted successfully',
        data: { submission },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'ASSESSMENT_ALREADY_SUBMITTED') {
        res.status(400).json({
          error: {
            code: 'ASSESSMENT_ALREADY_SUBMITTED',
            message: 'You have already submitted this assessment',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      logger.error('Failed to submit assessment', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit assessment',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }
}

export const studentAssessmentController = new StudentAssessmentController();
