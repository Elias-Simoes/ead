import { Router } from 'express';
import { backupController } from '../controllers/backup.controller';
import { authenticate, authorize } from '../../../shared/middleware/auth.middleware';

const router = Router();

// List all backups
router.get(
  '/list',
  authenticate,
  authorize('admin'),
  async (req, res) => await backupController.listBackups(req, res)
);

// Create manual backup
router.post(
  '/create',
  authenticate,
  authorize('admin'),
  async (req, res) => await backupController.createBackup(req, res)
);

// Restore from backup
router.post(
  '/restore',
  authenticate,
  authorize('admin'),
  async (req, res) => await backupController.restoreBackup(req, res)
);

// Download backup
router.get(
  '/download/:filename',
  authenticate,
  authorize('admin'),
  async (req, res) => await backupController.downloadBackup(req, res)
);

// Delete backup
router.delete(
  '/:filename',
  authenticate,
  authorize('admin'),
  async (req, res) => await backupController.deleteBackup(req, res)
);

export default router;
