import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

// Basic health check
router.get('/', healthController.getHealth.bind(healthController));

// Database health check
router.get('/db', healthController.getDatabaseHealth.bind(healthController));

// Redis health check
router.get('/redis', healthController.getRedisHealth.bind(healthController));

// All services health check
router.get('/all', healthController.getAllServicesHealth.bind(healthController));

// Kubernetes probes
router.get('/ready', healthController.getReadiness.bind(healthController));
router.get('/live', healthController.getLiveness.bind(healthController));

export default router;
