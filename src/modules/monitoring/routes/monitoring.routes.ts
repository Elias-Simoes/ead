import { Router } from 'express';
import { monitoringController } from '../controllers/monitoring.controller';
import { authenticate, authorize } from '../../../shared/middleware/auth.middleware';

const router = Router();

// All monitoring routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Metrics endpoints
router.get('/metrics', monitoringController.getMetrics.bind(monitoringController));
router.get('/metrics/history', monitoringController.getMetricsHistory.bind(monitoringController));
router.get('/metrics/average', monitoringController.getAverageMetrics.bind(monitoringController));

// Alerts endpoints
router.get('/alerts', monitoringController.getAlerts.bind(monitoringController));
router.post('/alerts/test', monitoringController.testAlert.bind(monitoringController));

export default router;
