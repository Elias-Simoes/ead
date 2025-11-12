import { Router } from 'express';
import { adminSubscriptionController } from '../controllers/admin-subscription.controller';
import { authenticate } from '@shared/middleware/auth.middleware';
import { authorize } from '@shared/middleware/authorization.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Get all subscriptions with filters
router.get(
  '/',
  adminSubscriptionController.getAllSubscriptions.bind(adminSubscriptionController)
);

// Get subscription statistics
router.get(
  '/stats',
  adminSubscriptionController.getSubscriptionStats.bind(adminSubscriptionController)
);

export default router;
