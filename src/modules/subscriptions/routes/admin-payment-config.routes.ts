import { Router } from 'express';
import { paymentConfigController } from '../controllers/payment-config.controller';
import { authenticate } from '@shared/middleware/auth.middleware';
import { roleMiddleware } from '@shared/middleware/role.middleware';

const router = Router();

/**
 * PUT /api/admin/payments/config
 * Update payment configuration
 * Admin only
 */
router.put(
  '/config',
  authenticate,
  roleMiddleware(['admin']),
  (req, res) => paymentConfigController.updateConfig(req, res)
);

export default router;
