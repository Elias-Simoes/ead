import { Router } from 'express';
import { paymentMetricsController } from '../controllers/payment-metrics.controller';
import { authenticate } from '@shared/middleware/auth.middleware';
import { roleMiddleware } from '@shared/middleware/role.middleware';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(roleMiddleware(['admin']));

// Get comprehensive payment metrics
router.get(
  '/metrics',
  (req, res) => paymentMetricsController.getMetrics(req, res)
);

// Get payment method statistics
router.get(
  '/stats',
  (req, res) => paymentMetricsController.getPaymentMethodStats(req, res)
);

// Get daily payment trends
router.get(
  '/trends',
  (req, res) => paymentMetricsController.getDailyTrends(req, res)
);

export default router;
