import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/upload
 * @desc    Upload a file to storage
 * @access  Authenticated users
 */
router.post(
  '/',
  authenticate,
  uploadController.uploadMiddleware,
  uploadController.uploadFile.bind(uploadController)
);

export default router;
