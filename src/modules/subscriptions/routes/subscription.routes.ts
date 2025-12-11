import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '@shared/middleware/auth.middleware';
import { authorize } from '@shared/middleware/authorization.middleware';

const router = Router();

// All subscription routes require authentication
router.use(authenticate);

// Get all active plans (public for authenticated users)
router.get('/plans', subscriptionController.getActivePlans.bind(subscriptionController));

// Get specific plan by ID
router.get('/plans/:planId', subscriptionController.getPlanById.bind(subscriptionController));

// Student-only routes
router.post(
  '/',
  authorize(['student']),
  subscriptionController.createSubscription.bind(subscriptionController)
);

router.get(
  '/current',
  authorize(['student']),
  subscriptionController.getCurrentSubscription.bind(subscriptionController)
);

router.post(
  '/cancel',
  authorize(['student']),
  subscriptionController.cancelSubscription.bind(subscriptionController)
);

router.post(
  '/reactivate',
  authorize(['student']),
  subscriptionController.reactivateSubscription.bind(subscriptionController)
);

router.post(
  '/renew',
  authorize(['student']),
  subscriptionController.renewSubscription.bind(subscriptionController)
);

export default router;
