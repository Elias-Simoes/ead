import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import express from 'express';

const router = Router();

// Webhook endpoint needs raw body for signature verification
// This should be registered before the JSON body parser middleware
router.post(
  '/payment',
  express.raw({ type: 'application/json' }),
  webhookController.handleWebhook.bind(webhookController)
);

export default router;
