import { Request, Response } from 'express';
import { storageService } from '@shared/services/storage.service';
import { logger } from '@shared/utils/logger';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

export class UploadController {
  /**
   * Upload middleware
   */
  uploadMiddleware = upload.single('file');

  /**
   * POST /api/upload
   * Upload a file to storage
   */
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No file provided',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      const file = req.file;
      const folder = (req.body.folder as string) || 'uploads';

      // Use original filename if storage service doesn't provide extension
      const filename = storageService.getExtensionFromContentType(file.mimetype)
        ? undefined
        : file.originalname;

      // Upload file
      const result = await storageService.uploadFile(file.buffer, {
        folder,
        filename,
        contentType: file.mimetype,
        isPublic: true,
      });

      logger.info('File uploaded via API', {
        userId: req.user?.userId,
        filename: file.originalname,
        size: file.size,
        url: result.url,
      });

      res.json({
        message: 'File uploaded successfully',
        data: {
          url: result.url,
          key: result.key,
          filename: file.originalname,
          size: file.size,
          contentType: file.mimetype,
        },
      });
    } catch (error: any) {
      logger.error('Upload failed', error);

      if (error.message === 'FILE_TOO_LARGE') {
        res.status(413).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum allowed (500MB)',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      if (error.message === 'INVALID_FILE_TYPE') {
        res.status(400).json({
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'File type not allowed',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload file',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

export const uploadController = new UploadController();
