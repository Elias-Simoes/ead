import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '@shared/middleware/auth.middleware';
import { authorize } from '@shared/middleware/authorization.middleware';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Create checkout with payment method selection (card or PIX)
router.post(
  '/checkout',
  authorize(['student']),
  paymentController.createCheckout.bind(paymentController)
);

// Get PIX payment status
router.get(
  '/pix/:paymentId/status',
  authorize(['student']),
  paymentController.getPixPaymentStatus.bind(paymentController)
);

export default router;
