import { Request, Response } from 'express';
import { certificateService } from '../services/certificate.service';
import { logger } from '@shared/utils/logger';

export class CertificateController {
  /**
   * GET /api/certificates
   * List all certificates for the authenticated student
   */
  async listStudentCertificates(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user!.userId;

      const certificates = await certificateService.listByStudent(studentId);

      res.status(200).json({
        success: true,
        data: certificates,
        count: certificates.length,
      });
    } catch (error) {
      logger.error('Failed to list student certificates', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve certificates',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * GET /api/certificates/:id/download
   * Get download URL for a certificate
   */
  async downloadCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;

      const certificate = await certificateService.findById(id);

      if (!certificate) {
        res.status(404).json({
          error: {
            code: 'CERTIFICATE_NOT_FOUND',
            message: 'Certificate not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Verify ownership
      if (certificate.studentId !== studentId) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this certificate',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Redirect to PDF URL
      res.redirect(certificate.pdfUrl);
    } catch (error) {
      logger.error('Failed to download certificate', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to download certificate',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * GET /api/public/certificates/verify/:code
   * Verify a certificate by its verification code (public endpoint)
   */
  async verifyCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const certificate = await certificateService.findByVerificationCode(code);

      if (!certificate) {
        res.status(404).json({
          error: {
            code: 'CERTIFICATE_NOT_FOUND',
            message: 'Certificate not found or invalid verification code',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          certificate: {
            id: certificate.id,
            studentName: certificate.studentName,
            courseName: certificate.courseName,
            courseWorkload: certificate.courseWorkload,
            issuedAt: certificate.issuedAt,
            verificationCode: certificate.verificationCode,
          },
        },
        message: 'Certificate is valid',
      });
    } catch (error) {
      logger.error('Failed to verify certificate', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to verify certificate',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * POST /api/certificates/issue/:courseId
   * Manually trigger certificate issuance for a course (for testing)
   */
  async issueCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const studentId = req.user!.userId;

      // Check eligibility
      const eligibility = await certificateService.checkEligibility(
        studentId,
        courseId
      );

      if (!eligibility.eligible) {
        res.status(400).json({
          error: {
            code: eligibility.reason || 'NOT_ELIGIBLE',
            message: this.getEligibilityMessage(eligibility.reason),
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Issue certificate
      const certificate = await certificateService.issueCertificate(
        studentId,
        courseId
      );

      res.status(201).json({
        success: true,
        data: certificate,
        message: 'Certificate issued successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'STUDENT_OR_COURSE_NOT_FOUND') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Student or course not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      logger.error('Failed to issue certificate', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to issue certificate',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  }

  /**
   * Get user-friendly eligibility message
   */
  private getEligibilityMessage(reason?: string): string {
    const messages: Record<string, string> = {
      COURSE_NOT_STARTED: 'You have not started this course yet',
      COURSE_NOT_COMPLETED: 'You must complete 100% of the course to receive a certificate',
      ASSESSMENT_NOT_PASSED: 'You must pass all assessments to receive a certificate',
    };

    return messages[reason || ''] || 'You are not eligible for a certificate';
  }
}

export const certificateController = new CertificateController();
