import { Router } from 'express';
import { paymentConfigController } from '../controllers/payment-config.controller';
import { cacheMiddleware } from '@shared/middleware/cache.middleware';

const router = Router();

/**
 * GET /api/payments/config
 * Get current payment configuration
 * Cached for 5 minutes
 */
router.get(
  '/',
  cacheMiddleware(300), // Cache for 5 minutes (300 seconds)
  (req, res) => paymentConfigController.getConfig(req, res)
);

export default router;
