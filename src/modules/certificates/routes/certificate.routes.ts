import { Router } from 'express';
import { authenticate, authorize } from '@shared/middleware/auth.middleware';
import { certificateController } from '../controllers/certificate.controller';

const router = Router();

/**
 * Certificate Routes
 */

// GET /api/certificates - List all certificates for the authenticated student
router.get(
  '/certificates',
  authenticate,
  authorize('student'),
  certificateController.listStudentCertificates.bind(certificateController)
);

// GET /api/certificates/:id/download - Download a certificate PDF
router.get(
  '/certificates/:id/download',
  authenticate,
  authorize('student'),
  certificateController.downloadCertificate.bind(certificateController)
);

// POST /api/certificates/issue/:courseId - Manually issue a certificate (for testing)
router.post(
  '/certificates/issue/:courseId',
  authenticate,
  authorize('student'),
  certificateController.issueCertificate.bind(certificateController)
);

// GET /api/public/certificates/verify/:code - Verify a certificate (public, no auth required)
router.get(
  '/public/certificates/verify/:code',
  certificateController.verifyCertificate.bind(certificateController)
);

export default router;
