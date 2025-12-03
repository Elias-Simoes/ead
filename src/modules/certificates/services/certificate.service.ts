import { pool } from '@config/database';
import { storageService } from '@shared/services/storage.service';
import { pdfGeneratorService } from './pdf-generator.service';
import { logger } from '@shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  verificationCode: string;
  pdfUrl: string;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateWithDetails extends Certificate {
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseWorkload: number;
}

export class CertificateService {
  /**
   * Generate and issue a certificate for a student
   */
  async issueCertificate(
    studentId: string,
    courseId: string
  ): Promise<Certificate> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if certificate already exists
      const existingCert = await this.findByStudentAndCourse(
        studentId,
        courseId
      );
      if (existingCert) {
        await client.query('ROLLBACK');
        return existingCert;
      }

      // Check eligibility (includes final grade)
      const eligibility = await this.checkEligibility(studentId, courseId);
      if (!eligibility.eligible) {
        throw new Error(`NOT_ELIGIBLE: ${eligibility.reason}`);
      }

      // Get student and course details
      const detailsQuery = `
        SELECT 
          u.name as student_name,
          u.email as student_email,
          c.title as course_name,
          c.workload as course_workload,
          sp.final_score
        FROM users u
        INNER JOIN students s ON s.id = u.id
        INNER JOIN courses c ON c.id = $1
        LEFT JOIN student_progress sp ON sp.student_id = u.id AND sp.course_id = c.id
        WHERE u.id = $2
      `;

      const detailsResult = await client.query(detailsQuery, [
        courseId,
        studentId,
      ]);

      if (detailsResult.rows.length === 0) {
        throw new Error('STUDENT_OR_COURSE_NOT_FOUND');
      }

      const details = detailsResult.rows[0];
      const finalGrade = eligibility.finalGrade || details.final_score;

      // Generate verification code
      const verificationCode = uuidv4();

      // Generate PDF
      const pdfBuffer = await pdfGeneratorService.generateCertificate({
        studentName: details.student_name,
        courseName: details.course_name,
        workload: details.course_workload,
        completionDate: new Date(),
        verificationCode,
      });

      // Upload PDF to storage
      const uploadResult = await storageService.uploadFile(pdfBuffer, {
        folder: 'certificates',
        filename: `${verificationCode}.pdf`,
        contentType: 'application/pdf',
        isPublic: true,
      });

      // Insert certificate record with final grade
      const insertQuery = `
        INSERT INTO certificates (
          student_id,
          course_id,
          verification_code,
          pdf_url,
          final_grade,
          issued_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const insertResult = await client.query(insertQuery, [
        studentId,
        courseId,
        verificationCode,
        uploadResult.url,
        finalGrade,
      ]);

      await client.query('COMMIT');

      logger.info('Certificate issued successfully', {
        studentId,
        courseId,
        verificationCode,
      });

      return this.mapCertificate(insertResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to issue certificate', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find certificate by student and course
   */
  async findByStudentAndCourse(
    studentId: string,
    courseId: string
  ): Promise<Certificate | null> {
    const query = `
      SELECT * FROM certificates
      WHERE student_id = $1 AND course_id = $2
    `;

    const result = await pool.query(query, [studentId, courseId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapCertificate(result.rows[0]);
  }

  /**
   * Find certificate by verification code
   */
  async findByVerificationCode(
    verificationCode: string
  ): Promise<CertificateWithDetails | null> {
    const query = `
      SELECT 
        cert.*,
        u.name as student_name,
        u.email as student_email,
        c.title as course_name,
        c.workload as course_workload
      FROM certificates cert
      INNER JOIN users u ON u.id = cert.student_id
      INNER JOIN courses c ON c.id = cert.course_id
      WHERE cert.verification_code = $1
    `;

    const result = await pool.query(query, [verificationCode]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...this.mapCertificate(row),
      studentName: row.student_name,
      studentEmail: row.student_email,
      courseName: row.course_name,
      courseWorkload: row.course_workload,
    };
  }

  /**
   * Find certificate by ID
   */
  async findById(certificateId: string): Promise<Certificate | null> {
    const query = `
      SELECT * FROM certificates
      WHERE id = $1
    `;

    const result = await pool.query(query, [certificateId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapCertificate(result.rows[0]);
  }

  /**
   * List all certificates for a student
   */
  async listByStudent(studentId: string): Promise<CertificateWithDetails[]> {
    const query = `
      SELECT 
        cert.*,
        u.name as student_name,
        u.email as student_email,
        c.title as course_name,
        c.workload as course_workload
      FROM certificates cert
      INNER JOIN users u ON u.id = cert.student_id
      INNER JOIN courses c ON c.id = cert.course_id
      WHERE cert.student_id = $1
      ORDER BY cert.issued_at DESC
    `;

    const result = await pool.query(query, [studentId]);

    return result.rows.map((row) => ({
      ...this.mapCertificate(row),
      studentName: row.student_name,
      studentEmail: row.student_email,
      courseName: row.course_name,
      courseWorkload: row.course_workload,
    }));
  }

  /**
   * Check if student is eligible for certificate
   */
  async checkEligibility(
    studentId: string,
    courseId: string
  ): Promise<{ eligible: boolean; reason?: string; finalGrade?: number }> {
    // Check if course is 100% complete
    const progressQuery = `
      SELECT 
        sp.progress_percentage,
        sp.completed_at,
        sp.final_score,
        c.passing_score
      FROM student_progress sp
      INNER JOIN courses c ON c.id = sp.course_id
      WHERE sp.student_id = $1 AND sp.course_id = $2
    `;

    const progressResult = await pool.query(progressQuery, [
      studentId,
      courseId,
    ]);

    if (progressResult.rows.length === 0) {
      return { eligible: false, reason: 'COURSE_NOT_STARTED' };
    }

    const progress = progressResult.rows[0];

    if (progress.progress_percentage < 100) {
      return { eligible: false, reason: 'COURSE_NOT_COMPLETED' };
    }

    // Check if there are assessments for this course
    const assessmentCountQuery = `
      SELECT COUNT(a.id) as assessment_count
      FROM assessments a
      INNER JOIN modules m ON a.module_id = m.id
      WHERE m.course_id = $1
    `;

    const assessmentCountResult = await pool.query(assessmentCountQuery, [courseId]);
    const assessmentCount = parseInt(assessmentCountResult.rows[0].assessment_count);

    // If there are assessments, validate completion and score
    if (assessmentCount > 0) {
      // Check if student completed ALL assessments
      const completedAssessmentsQuery = `
        SELECT COUNT(DISTINCT sa.assessment_id) as completed_count
        FROM student_assessments sa
        INNER JOIN assessments a ON sa.assessment_id = a.id
        INNER JOIN modules m ON a.module_id = m.id
        WHERE sa.student_id = $1 
          AND m.course_id = $2 
          AND sa.status = 'graded'
      `;

      const completedResult = await pool.query(completedAssessmentsQuery, [
        studentId,
        courseId,
      ]);
      const completedCount = parseInt(completedResult.rows[0].completed_count);

      // Student must complete ALL assessments
      if (completedCount < assessmentCount) {
        return { 
          eligible: false, 
          reason: `ASSESSMENTS_NOT_COMPLETED: ${completedCount}/${assessmentCount} completed` 
        };
      }

      // Calculate final score (average of all assessments)
      const finalScore = await this.calculateFinalScore(studentId, courseId);

      if (finalScore === null || finalScore === undefined || finalScore === 0) {
        return { eligible: false, reason: 'FINAL_SCORE_NOT_CALCULATED' };
      }

      const passingScore = parseFloat(progress.passing_score || 7.0);

      if (finalScore < passingScore) {
        return { 
          eligible: false, 
          reason: 'FINAL_GRADE_BELOW_PASSING_SCORE',
          finalGrade: finalScore 
        };
      }

      return { eligible: true, finalGrade: finalScore };
    }

    // No assessments, just check completion
    return { eligible: true };
  }

  /**
   * Calculate final score for a student in a course
   * Now supports both course-level and module-level assessments
   */
  private async calculateFinalScore(
    studentId: string,
    courseId: string
  ): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT AVG(sa.score) as final_score
         FROM student_assessments sa
         INNER JOIN assessments a ON sa.assessment_id = a.id
         LEFT JOIN modules m ON a.module_id = m.id
         WHERE sa.student_id = $1 
           AND (a.course_id = $2 OR m.course_id = $2)
           AND sa.status = 'graded'`,
        [studentId, courseId]
      );

      return parseFloat(result.rows[0]?.final_score || '0');
    } catch (error) {
      logger.error('Failed to calculate final score', error);
      throw error;
    }
  }

  /**
   * Map database row to Certificate object
   */
  private mapCertificate(row: any): Certificate {
    return {
      id: row.id,
      studentId: row.student_id,
      courseId: row.course_id,
      verificationCode: row.verification_code,
      pdfUrl: row.pdf_url,
      issuedAt: row.issued_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const certificateService = new CertificateService();
