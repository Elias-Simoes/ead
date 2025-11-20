# Backend - Código Completo para Avaliações

## Status
- ✅ Service já está correto (assessment.service.ts)
- ⏳ Precisa completar controller
- ⏳ Precisa atualizar rotas

## Próximos Passos

### 1. Atualizar assessment.controller.ts

Adicionar os seguintes métodos ao controller existente:

```typescript
// Adicionar ao final da classe AssessmentController

/**
 * Create assessment for a course
 * POST /api/courses/:courseId/assessments
 */
async createAssessment(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const { title, type, passing_score } = req.body;
    const instructorId = req.user!.userId;

    // Check if instructor owns the course
    const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
    if (!isOwner) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to create assessments for this course',
        },
      });
      return;
    }

    const assessment = await assessmentService.createAssessment({
      course_id: courseId,
      title,
      type,
      passing_score,
    });

    res.status(201).json({
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    logger.error('Failed to create assessment', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create assessment',
      },
    });
  }
}

/**
 * Get assessments by course
 * GET /api/courses/:courseId/assessments
 */
async getAssessmentsByCourse(req: Request, res: Response): Promise<void> {
  try {
    const { courseId } = req.params;
    const instructorId = req.user!.userId;

    // Check if instructor owns the course
    const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
    if (!isOwner) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view assessments for this course',
        },
      });
      return;
    }

    const assessments = await assessmentService.getAssessmentsByCourse(courseId);

    res.status(200).json({
      message: 'Assessments retrieved successfully',
      data: assessments,
    });
  } catch (error) {
    logger.error('Failed to get assessments', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve assessments',
      },
    });
  }
}

/**
 * Get assessment with questions
 * GET /api/assessments/:id
 */
async getAssessmentWithQuestions(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const instructorId = req.user!.userId;

    const assessment = await assessmentService.getAssessmentWithQuestions(id);
    
    if (!assessment) {
      res.status(404).json({
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        },
      });
      return;
    }

    // Check if instructor owns the course
    const isOwner = await courseService.isInstructorOwner(assessment.course_id, instructorId);
    if (!isOwner) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this assessment',
        },
      });
      return;
    }

    res.status(200).json({
      message: 'Assessment retrieved successfully',
      data: assessment,
    });
  } catch (error) {
    logger.error('Failed to get assessment', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve assessment',
      },
    });
  }
}

/**
 * Create question for assessment
 * POST /api/assessments/:id/questions
 */
async createQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { id: assessmentId } = req.params;
    const { text, type, options, correct_answer, points, order_index } = req.body;
    const instructorId = req.user!.userId;

    // Get course ID from assessment
    const courseId = await assessmentService.getCourseIdByAssessmentId(assessmentId);
    if (!courseId) {
      res.status(404).json({
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        },
      });
      return;
    }

    // Check if instructor owns the course
    const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
    if (!isOwner) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to add questions to this assessment',
        },
      });
      return;
    }

    const question = await assessmentService.createQuestion({
      assessment_id: assessmentId,
      text,
      type,
      options,
      correct_answer,
      points,
      order_index,
    });

    res.status(201).json({
      message: 'Question created successfully',
      data: question,
    });
  } catch (error) {
    logger.error('Failed to create question', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create question',
      },
    });
  }
}

/**
 * Update question
 * PATCH /api/questions/:id
 */
async updateQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { id: questionId } = req.params;
    const { text, options, correct_answer, points, order_index } = req.body;
    const instructorId = req.user!.userId;

    // Get assessment ID from question
    const assessmentId = await assessmentService.getAssessmentIdByQuestionId(questionId);
    if (!assessmentId) {
      res.status(404).json({
        error: {
          code: 'QUESTION_NOT_FOUND',
          message: 'Question not found',
        },
      });
      return;
    }

    // Get course ID from assessment
    const courseId = await assessmentService.getCourseIdByAssessmentId(assessmentId);
    if (!courseId) {
      res.status(404).json({
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        },
      });
      return;
    }

    // Check if instructor owns the course
    const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
    if (!isOwner) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this question',
        },
      });
      return;
    }

    const question = await assessmentService.updateQuestion(questionId, {
      text,
      options,
      correct_answer,
      points,
      order_index,
    });

    res.status(200).json({
      message: 'Question updated successfully',
      data: question,
    });
  } catch (error) {
    logger.error('Failed to update question', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update question',
      },
    });
  }
}

/**
 * Delete question
 * DELETE /api/questions/:id
 */
async deleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    const { id: questionId } = req.params;
    const instructorId = req.user!.userId;

    // Get assessment ID from question
    const assessmentId = await assessmentService.getAssessmentIdByQuestionId(questionId);
    if (!assessmentId) {
      res.status(404).json({
        error: {
          code: 'QUESTION_NOT_FOUND',
          message: 'Question not found',
        },
      });
      return;
    }

    // Get course ID from assessment
    const courseId = await assessmentService.getCourseIdByAssessmentId(assessmentId);
    if (!courseId) {
      res.status(404).json({
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        },
      });
      return;
    }

    // Check if instructor owns the course
    const isOwner = await courseService.isInstructorOwner(courseId, instructorId);
    if (!isOwner) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this question',
        },
      });
      return;
    }

    await assessmentService.deleteQuestion(questionId);

    res.status(200).json({
      message: 'Question deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete question', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete question',
      },
    });
  }
}
```

### 2. Adicionar import no controller

No topo do arquivo `assessment.controller.ts`, adicionar:

```typescript
import { courseService } from '@modules/courses/services/course.service';
```

### 3. Atualizar rotas em assessment.routes.ts

Adicionar as seguintes rotas:

```typescript
// Rotas de avaliações
router.post('/courses/:courseId/assessments', 
  authMiddleware, 
  roleMiddleware(['instructor']), 
  assessmentController.createAssessment
);

router.get('/courses/:courseId/assessments', 
  authMiddleware, 
  roleMiddleware(['instructor']), 
  assessmentController.getAssessmentsByCourse
);

router.get('/assessments/:id', 
  authMiddleware, 
  roleMiddleware(['instructor']), 
  assessmentController.getAssessmentWithQuestions
);

// Rotas de questões
router.post('/assessments/:id/questions', 
  authMiddleware, 
  roleMiddleware(['instructor']), 
  assessmentController.createQuestion
);

router.patch('/questions/:id', 
  authMiddleware, 
  roleMiddleware(['instructor']), 
  assessmentController.updateQuestion
);

router.delete('/questions/:id', 
  authMiddleware, 
  roleMiddleware(['instructor']), 
  assessmentController.deleteQuestion
);
```

## Implementação Completa

Agora vou implementar isso nos arquivos reais...
