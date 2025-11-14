import { Request, Response } from 'express';
import { backupService } from '../services/backup.service';
import { backupJob } from '../jobs/backup.job';
import { storageService } from '../../../shared/services/storage.service';
import { logger } from '../../../shared/utils/logger';

export class BackupController {
  /**
   * List all available backups
   * GET /api/admin/backup/list
   */
  async listBackups(_req: Request, res: Response): Promise<void> {
    try {
      const backups = await backupService.listBackups();

      res.status(200).json({
        success: true,
        data: backups.map((backup) => ({
          filename: backup.key.replace('backups/', ''),
          lastModified: backup.lastModified,
          size: backup.size,
          sizeInMB: (backup.size / (1024 * 1024)).toFixed(2),
        })),
      });
    } catch (error) {
      logger.error('Failed to list backups', error);
      res.status(500).json({
        error: {
          code: 'BACKUP_LIST_FAILED',
          message: 'Failed to list backups',
        },
      });
    }
  }

  /**
   * Create a manual backup
   * POST /api/admin/backup/create
   */
  async createBackup(_req: Request, res: Response): Promise<void> {
    try {
      await backupJob.executeNow();

      res.status(200).json({
        success: true,
        message: 'Backup created successfully',
      });
    } catch (error) {
      logger.error('Failed to create backup', error);
      res.status(500).json({
        error: {
          code: 'BACKUP_CREATE_FAILED',
          message: 'Failed to create backup',
        },
      });
    }
  }

  /**
   * Restore database from backup
   * POST /api/admin/backup/restore
   */
  async restoreBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.body;

      if (!filename) {
        res.status(400).json({
          error: {
            code: 'MISSING_FILENAME',
            message: 'Backup filename is required',
          },
        });
        return;
      }

      // Validate filename format
      if (!filename.match(/^backup-[\d-]+\.sql$/)) {
        res.status(400).json({
          error: {
            code: 'INVALID_FILENAME',
            message: 'Invalid backup filename format',
          },
        });
        return;
      }

      logger.warn(`Database restore initiated by user ${(req.user as any)?.id}`, {
        filename,
        userId: (req.user as any)?.id,
      });

      await backupService.restoreBackup(filename);

      res.status(200).json({
        success: true,
        message: 'Database restored successfully',
      });
    } catch (error) {
      logger.error('Failed to restore backup', error);
      res.status(500).json({
        error: {
          code: 'BACKUP_RESTORE_FAILED',
          message: 'Failed to restore database from backup',
        },
      });
    }
  }

  /**
   * Download a backup file
   * GET /api/admin/backup/download/:filename
   */
  async downloadBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          error: {
            code: 'MISSING_FILENAME',
            message: 'Backup filename is required',
          },
        });
        return;
      }

      // Validate filename format
      if (!filename.match(/^backup-[\d-]+\.sql$/)) {
        res.status(400).json({
          error: {
            code: 'INVALID_FILENAME',
            message: 'Invalid backup filename format',
          },
        });
        return;
      }

      const backupBuffer = await backupService.downloadBackup(filename);

      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(backupBuffer);
    } catch (error) {
      logger.error('Failed to download backup', error);
      res.status(500).json({
        error: {
          code: 'BACKUP_DOWNLOAD_FAILED',
          message: 'Failed to download backup',
        },
      });
    }
  }

  /**
   * Delete a backup file
   * DELETE /api/admin/backup/:filename
   */
  async deleteBackup(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({
          error: {
            code: 'MISSING_FILENAME',
            message: 'Backup filename is required',
          },
        });
        return;
      }

      // Validate filename format
      if (!filename.match(/^backup-[\d-]+\.sql$/)) {
        res.status(400).json({
          error: {
            code: 'INVALID_FILENAME',
            message: 'Invalid backup filename format',
          },
        });
        return;
      }

      const storageKey = `backups/${filename}`;
      await storageService.deleteFile(storageKey);

      logger.info(`Backup deleted by user ${(req.user as any)?.id}`, {
        filename,
        userId: (req.user as any)?.id,
      });

      res.status(200).json({
        success: true,
        message: 'Backup deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete backup', error);
      res.status(500).json({
        error: {
          code: 'BACKUP_DELETE_FAILED',
          message: 'Failed to delete backup',
        },
      });
    }
  }
}

export const backupController = new BackupController();
