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

      // Get student and course details
      const detailsQuery = `
        SELECT 
          u.name as student_name,
          u.email as student_email,
          c.title as course_name,
          c.workload as course_workload
        FROM users u
        INNER JOIN students s ON s.id = u.id
        INNER JOIN courses c ON c.id = $1
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

      // Insert certificate record
      const insertQuery = `
        INSERT INTO certificates (
          student_id,
          course_id,
          verification_code,
          pdf_url,
          issued_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const insertResult = await client.query(insertQuery, [
        studentId,
        courseId,
        verificationCode,
        uploadResult.url,
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
  ): Promise<{ eligible: boolean; reason?: string }> {
    // Check if course is 100% complete
    const progressQuery = `
      SELECT 
        progress_percentage,
        completed_at,
        final_score
      FROM student_progress
      WHERE student_id = $1 AND course_id = $2
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

    // Check if there are assessments and if student passed
    const assessmentQuery = `
      SELECT 
        a.passing_score,
        sa.score
      FROM assessments a
      LEFT JOIN student_assessments sa ON sa.assessment_id = a.id AND sa.student_id = $1
      WHERE a.course_id = $2
    `;

    const assessmentResult = await pool.query(assessmentQuery, [
      studentId,
      courseId,
    ]);

    // If there are assessments, check if all are passed
    for (const assessment of assessmentResult.rows) {
      if (!assessment.score || assessment.score < assessment.passing_score) {
        return { eligible: false, reason: 'ASSESSMENT_NOT_PASSED' };
      }
    }

    return { eligible: true };
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
