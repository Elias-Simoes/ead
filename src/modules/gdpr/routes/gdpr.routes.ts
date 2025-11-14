import { Router } from 'express';
import { gdprController } from '../controllers/gdpr.controller';
import { authenticate } from '@shared/middleware/auth.middleware';

const router = Router();

/**
 * GDPR/LGPD Routes
 * All routes require authentication
 */

// Get all user data (GDPR data access request)
router.get('/my-data', authenticate, (req, res, next) =>
  gdprController.getMyData(req, res, next)
);

// Request account deletion
router.post('/delete-account', authenticate, (req, res, next) =>
  gdprController.requestAccountDeletion(req, res, next)
);

// Cancel account deletion request
router.post('/cancel-deletion', authenticate, (req, res, next) =>
  gdprController.cancelAccountDeletion(req, res, next)
);

// Get deletion request status
router.get('/deletion-status', authenticate, (req, res, next) =>
  gdprController.getDeletionStatus(req, res, next)
);

export default router;
