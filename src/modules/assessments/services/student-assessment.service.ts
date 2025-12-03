import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { assessmentService } from './assessment.service';

export interface SubmitAssessmentData {
  student_id: string;
  assessment_id: string;
  answers: Answer[];
}

export interface Answer {
  question_id: string;
  answer: string | number;
}

export interface StudentAssessment {
  id: string;
  student_id: string;
  assessment_id: string;
  answers: any;
  score?: number;
  status: string;
  submitted_at: Date;
  graded_at?: Date;
  graded_by?: string;
  feedback?: string;
}

export class StudentAssessmentService {
  /**
   * Submit assessment answers (allows multiple attempts)
   */
  async submitAssessment(data: SubmitAssessmentData): Promise<StudentAssessment> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Mark all previous attempts as not latest
      await client.query(
        'UPDATE student_assessments SET is_latest = false WHERE student_id = $1 AND assessment_id = $2',
        [data.student_id, data.assessment_id]
      );

      // Get attempt number
      const attemptResult = await client.query(
        'SELECT COUNT(*) as count FROM student_assessments WHERE student_id = $1 AND assessment_id = $2',
        [data.student_id, data.assessment_id]
      );

      const attemptNumber = parseInt(attemptResult.rows[0].count) + 1;

      // Get assessment with questions
      const assessment = await assessmentService.getAssessmentWithQuestions(data.assessment_id);

      if (!assessment) {
        throw new Error('ASSESSMENT_NOT_FOUND');
      }

      // Calculate score (assessment has 10 points total)
      let earnedPoints = 0;
      const answerMap = new Map(data.answers.map((a) => [a.question_id, a.answer]));

      for (const question of assessment.questions) {
        const studentAnswer = answerMap.get(question.id);

        if (question.type === 'multiple_choice' && question.correctAnswer !== null) {
          if (studentAnswer === question.correctAnswer) {
            earnedPoints += question.points;
          }
        }
      }

      // Score is out of 10
      const score = earnedPoints;
      const status = 'graded';

      // Insert student assessment
      const result = await client.query(
        `INSERT INTO student_assessments (student_id, assessment_id, answers, score, status, attempt_number, is_latest, graded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING *`,
        [data.student_id, data.assessment_id, JSON.stringify(data.answers), score, status, attemptNumber, true]
      );

      // Get course ID from assessment to update final score
      const courseIdResult = await client.query(
        `SELECT m.course_id 
         FROM assessments a
         INNER JOIN modules m ON a.module_id = m.id
         WHERE a.id = $1`,
        [data.assessment_id]
      );

      if (courseIdResult.rows.length > 0) {
        const courseId = courseIdResult.rows[0].course_id;
        
        // Calculate and update final grade
        const finalGrade = await this.calculateFinalGrade(data.student_id, courseId);
        
        if (finalGrade !== null) {
          await client.query(
            'UPDATE student_progress SET final_score = $1 WHERE student_id = $2 AND course_id = $3',
            [finalGrade, data.student_id, courseId]
          );
          
          logger.info('Final grade updated', {
            studentId: data.student_id,
            courseId,
            finalGrade,
          });
        }
      }

      await client.query('COMMIT');

      logger.info('Assessment submitted', {
        studentAssessmentId: result.rows[0].id,
        studentId: data.student_id,
        assessmentId: data.assessment_id,
        score,
        attemptNumber,
      });

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to submit assessment', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get student assessment by ID
   */
  async getStudentAssessmentById(studentAssessmentId: string): Promise<StudentAssessment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM student_assessments WHERE id = $1',
        [studentAssessmentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get student assessment', error);
      throw error;
    }
  }

  /**
   * Get student's submission for an assessment
   */
  async getStudentSubmission(
    studentId: string,
    assessmentId: string
  ): Promise<StudentAssessment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM student_assessments WHERE student_id = $1 AND assessment_id = $2',
        [studentId, assessmentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get student submission', error);
      throw error;
    }
  }

  /**
   * Get all submissions for an assessment
   */
  async getAssessmentSubmissions(assessmentId: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT sa.*, u.name as student_name, u.email as student_email
         FROM student_assessments sa
         INNER JOIN students s ON sa.student_id = s.id
         INNER JOIN users u ON s.id = u.id
         WHERE sa.assessment_id = $1
         ORDER BY sa.submitted_at DESC`,
        [assessmentId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get assessment submissions', error);
      throw error;
    }
  }

  /**
   * Get pending assessments for grading (instructor)
   */
  async getPendingAssessments(instructorId: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT sa.*, a.title as assessment_title, m.title as module_title, c.title as course_title,
                u.name as student_name, u.email as student_email
         FROM student_assessments sa
         INNER JOIN assessments a ON sa.assessment_id = a.id
         INNER JOIN modules m ON a.module_id = m.id
         INNER JOIN courses c ON m.course_id = c.id
         INNER JOIN students s ON sa.student_id = s.id
         INNER JOIN users u ON s.id = u.id
         WHERE c.instructor_id = $1 AND sa.status = 'pending' AND sa.is_latest = true
         ORDER BY sa.submitted_at ASC`,
        [instructorId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get pending assessments', error);
      throw error;
    }
  }

  /**
   * Grade an assessment (instructor)
   */
  async gradeAssessment(
    studentAssessmentId: string,
    score: number,
    feedback: string,
    gradedBy: string
  ): Promise<StudentAssessment> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE student_assessments
         SET score = $1, feedback = $2, status = 'graded', graded_at = CURRENT_TIMESTAMP, graded_by = $3
         WHERE id = $4
         RETURNING *`,
        [score, feedback, gradedBy, studentAssessmentId]
      );

      if (result.rows.length === 0) {
        throw new Error('STUDENT_ASSESSMENT_NOT_FOUND');
      }

      const gradedAssessment = result.rows[0];

      // Get course ID from assessment
      const assessmentResult = await client.query(
        'SELECT course_id FROM assessments WHERE id = $1',
        [gradedAssessment.assessment_id]
      );

      if (assessmentResult.rows.length > 0) {
        const courseId = assessmentResult.rows[0].course_id;

        // Recalculate final score for the student in this course
        await this.calculateAndUpdateFinalScoreInTransaction(
          gradedAssessment.student_id,
          courseId,
          client
        );
      }

      await client.query('COMMIT');

      logger.info('Assessment graded', {
        studentAssessmentId,
        score,
        gradedBy,
      });

      return gradedAssessment;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to grade assessment', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate and update final score within a transaction
   * (Helper method for use within existing transactions)
   */
  private async calculateAndUpdateFinalScoreInTransaction(
    studentId: string,
    courseId: string,
    client: any
  ): Promise<number | null> {
    try {
      // Get all assessments for the course
      const assessmentsResult = await client.query(
        'SELECT id FROM assessments WHERE course_id = $1',
        [courseId]
      );

      if (assessmentsResult.rows.length === 0) {
        return null;
      }

      const assessmentIds = assessmentsResult.rows.map((row: any) => row.id);

      // Get all graded student assessments
      const studentAssessmentsResult = await client.query(
        `SELECT sa.score, a.id as assessment_id
         FROM student_assessments sa
         INNER JOIN assessments a ON sa.assessment_id = a.id
         WHERE sa.student_id = $1 
           AND a.course_id = $2 
           AND sa.status = 'graded'
           AND sa.score IS NOT NULL`,
        [studentId, courseId]
      );

      if (studentAssessmentsResult.rows.length === 0) {
        return null;
      }

      // Get total points for each assessment
      const assessmentPointsMap = new Map<string, number>();

      for (const assessmentId of assessmentIds) {
        const questionsResult = await client.query(
          'SELECT SUM(points) as total_points FROM questions WHERE assessment_id = $1',
          [assessmentId]
        );

        const totalPoints = parseFloat(questionsResult.rows[0].total_points || 0);
        assessmentPointsMap.set(assessmentId, totalPoints);
      }

      // Calculate weighted average
      let totalWeight = 0;
      let weightedSum = 0;

      for (const row of studentAssessmentsResult.rows) {
        const weight = assessmentPointsMap.get(row.assessment_id) || 0;
        totalWeight += weight;
        weightedSum += row.score * weight;
      }

      const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Update student_progress with final score
      await client.query(
        `UPDATE student_progress
         SET final_score = $1
         WHERE student_id = $2 AND course_id = $3`,
        [finalScore, studentId, courseId]
      );

      logger.info('Final course score calculated and updated', {
        studentId,
        courseId,
        finalScore,
      });

      return finalScore;
    } catch (error) {
      logger.error('Failed to calculate final score in transaction', error);
      throw error;
    }
  }

  /**
   * Get latest attempt for a student on an assessment
   */
  async getLatestAttempt(studentId: string, assessmentId: string): Promise<StudentAssessment | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM student_assessments WHERE student_id = $1 AND assessment_id = $2 AND is_latest = true',
        [studentId, assessmentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get latest attempt', error);
      throw error;
    }
  }

  /**
   * Get all attempts for a student on an assessment
   */
  async getAttempts(studentId: string, assessmentId: string): Promise<StudentAssessment[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM student_assessments WHERE student_id = $1 AND assessment_id = $2 ORDER BY attempt_number DESC',
        [studentId, assessmentId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get attempts', error);
      throw error;
    }
  }

  /**
   * Calculate final grade for a course (average of all module assessments)
   */
  async calculateFinalGrade(studentId: string, courseId: string): Promise<number | null> {
    try {
      // Get all modules for the course
      const modulesResult = await pool.query(
        'SELECT id FROM modules WHERE course_id = $1',
        [courseId]
      );

      if (modulesResult.rows.length === 0) {
        return null;
      }

      const moduleIds = modulesResult.rows.map((row) => row.id);

      // Get assessments for each module
      const assessmentsResult = await pool.query(
        'SELECT id, module_id FROM assessments WHERE module_id = ANY($1)',
        [moduleIds]
      );

      if (assessmentsResult.rows.length === 0) {
        return null;
      }

      // Get latest attempt for each assessment
      const scores: number[] = [];

      for (const assessment of assessmentsResult.rows) {
        const latestAttempt = await this.getLatestAttempt(studentId, assessment.id);

        if (!latestAttempt || latestAttempt.score === null || latestAttempt.score === undefined) {
          // Student hasn't completed this assessment yet
          return null;
        }

        scores.push(latestAttempt.score);
      }

      // Calculate average (all assessments have equal weight of 10 points)
      const finalGrade = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      return finalGrade;
    } catch (error) {
      logger.error('Failed to calculate final grade', error);
      throw error;
    }
  }

  /**
   * Check if student has already submitted assessment
   */
  async hasSubmitted(studentId: string, assessmentId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT id FROM student_assessments WHERE student_id = $1 AND assessment_id = $2',
        [studentId, assessmentId]
      );

      return result.rows.length > 0;
    } catch (error) {
      logger.error('Failed to check if student has submitted', error);
      throw error;
    }
  }

  /**
   * Calculate and update final course score for a student
   * This calculates the weighted average of all graded assessments
   */
  async calculateAndUpdateFinalScore(studentId: string, courseId: string): Promise<number | null> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get all assessments for the course
      const assessmentsResult = await client.query(
        'SELECT id FROM assessments WHERE course_id = $1',
        [courseId]
      );

      if (assessmentsResult.rows.length === 0) {
        // No assessments for this course
        return null;
      }

      const assessmentIds = assessmentsResult.rows.map((row) => row.id);

      // Get all graded student assessments for this student and course
      const studentAssessmentsResult = await client.query(
        `SELECT sa.score, a.id as assessment_id
         FROM student_assessments sa
         INNER JOIN assessments a ON sa.assessment_id = a.id
         WHERE sa.student_id = $1 
           AND a.course_id = $2 
           AND sa.status = 'graded'
           AND sa.score IS NOT NULL`,
        [studentId, courseId]
      );

      if (studentAssessmentsResult.rows.length === 0) {
        // No graded assessments yet
        return null;
      }

      // Get total points for each assessment
      const assessmentPointsMap = new Map<string, number>();

      for (const assessmentId of assessmentIds) {
        const questionsResult = await client.query(
          'SELECT SUM(points) as total_points FROM questions WHERE assessment_id = $1',
          [assessmentId]
        );

        const totalPoints = parseFloat(questionsResult.rows[0].total_points || 0);
        assessmentPointsMap.set(assessmentId, totalPoints);
      }

      // Calculate weighted average
      let totalWeight = 0;
      let weightedSum = 0;

      for (const row of studentAssessmentsResult.rows) {
        const weight = assessmentPointsMap.get(row.assessment_id) || 0;
        totalWeight += weight;
        weightedSum += row.score * weight;
      }

      const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Update student_progress with final score
      await client.query(
        `UPDATE student_progress
         SET final_score = $1
         WHERE student_id = $2 AND course_id = $3`,
        [finalScore, studentId, courseId]
      );

      await client.query('COMMIT');

      logger.info('Final course score calculated and updated', {
        studentId,
        courseId,
        finalScore,
      });

      return finalScore;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to calculate final score', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get final score for a student in a course
   */
  async getFinalScore(studentId: string, courseId: string): Promise<number | null> {
    try {
      const result = await pool.query(
        'SELECT final_score FROM student_progress WHERE student_id = $1 AND course_id = $2',
        [studentId, courseId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].final_score;
    } catch (error) {
      logger.error('Failed to get final score', error);
      throw error;
    }
  }
}

export const studentAssessmentService = new StudentAssessmentService();
