import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '@shared/middleware/auth.middleware';
import { authorize } from '@shared/middleware/authorization.middleware';

const router = Router();

// All report routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Report endpoints
router.get('/overview', reportController.getOverviewReport.bind(reportController));
router.get('/subscriptions', reportController.getSubscriptionReport.bind(reportController));
router.get('/courses', reportController.getCourseReport.bind(reportController));
router.get('/financial', reportController.getFinancialReport.bind(reportController));
router.get('/export', reportController.exportReport.bind(reportController));

export default router;
