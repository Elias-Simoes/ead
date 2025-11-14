import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../../../config/env';
import { storageService } from '../../../shared/services/storage.service';
import { logger } from '../../../shared/utils/logger';

const execAsync = promisify(exec);

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');

  /**
   * Create a database backup using pg_dump
   */
  async createBackup(): Promise<{ filename: string; path: string; size: number }> {
    try {
      logger.info('Starting database backup...');

      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const backupPath = path.join(this.backupDir, filename);

      // Build pg_dump command
      const { host, port, name, user, password } = config.database;
      const pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${name} -F p -f "${backupPath}"`;

      // Execute backup
      await execAsync(pgDumpCommand);

      // Get file size
      const stats = await fs.stat(backupPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      logger.info(`Database backup created: ${filename} (${sizeInMB} MB)`);

      return {
        filename,
        path: backupPath,
        size: stats.size,
      };
    } catch (error) {
      logger.error('Failed to create database backup', error as Error);
      throw new Error('Database backup failed');
    }
  }

  /**
   * Upload backup to cloud storage (S3/R2)
   */
  async uploadBackup(backupPath: string, filename: string): Promise<string> {
    try {
      logger.info(`Uploading backup to cloud storage: ${filename}`);

      // Read backup file
      const fileBuffer = await fs.readFile(backupPath);

      // Upload to storage
      const result = await storageService.uploadFile(fileBuffer, {
        folder: 'backups',
        filename: filename,
        contentType: 'application/sql',
        isPublic: false,
      });

      logger.info(`Backup uploaded successfully: ${result.url}`);

      return result.url;
    } catch (error) {
      logger.error('Failed to upload backup to cloud storage', error);
      throw new Error('Backup upload failed');
    }
  }

  /**
   * Delete local backup file
   */
  async deleteLocalBackup(backupPath: string): Promise<void> {
    try {
      await fs.unlink(backupPath);
      logger.info(`Local backup deleted: ${backupPath}`);
    } catch (error) {
      logger.warn(`Failed to delete local backup: ${backupPath}`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * List all backups in cloud storage
   */
  async listBackups(): Promise<Array<{ key: string; lastModified: Date; size: number }>> {
    try {
      const backups = await storageService.listFiles('backups/');
      return backups;
    } catch (error) {
      logger.error('Failed to list backups', error);
      throw new Error('Failed to list backups');
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  async rotateBackups(): Promise<void> {
    try {
      logger.info('Starting backup rotation...');

      const backups = await this.listBackups();
      const retentionDays = config.backup.retentionDays;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const backupsToDelete = backups.filter(
        (backup) => backup.lastModified < cutoffDate
      );

      logger.info(`Found ${backupsToDelete.length} backups to delete (older than ${retentionDays} days)`);

      for (const backup of backupsToDelete) {
        await storageService.deleteFile(backup.key);
        logger.info(`Deleted old backup: ${backup.key}`);
      }

      logger.info('Backup rotation completed');
    } catch (error) {
      logger.error('Failed to rotate backups', error);
      throw new Error('Backup rotation failed');
    }
  }

  /**
   * Execute full backup process: create, upload, cleanup, rotate
   */
  async executeBackup(): Promise<void> {
    try {
      logger.info('=== Starting backup process ===');

      // Create backup
      const { filename, path: backupPath } = await this.createBackup();

      // Upload to cloud storage
      await this.uploadBackup(backupPath, filename);

      // Delete local backup
      await this.deleteLocalBackup(backupPath);

      // Rotate old backups
      await this.rotateBackups();

      logger.info('=== Backup process completed successfully ===');
    } catch (error) {
      logger.error('Backup process failed', error);
      throw error;
    }
  }

  /**
   * Download backup from cloud storage
   */
  async downloadBackup(filename: string): Promise<Buffer> {
    try {
      logger.info(`Downloading backup: ${filename}`);

      const storageKey = `backups/${filename}`;
      const fileBuffer = await storageService.downloadFile(storageKey);

      logger.info(`Backup downloaded successfully: ${filename}`);

      return fileBuffer;
    } catch (error) {
      logger.error('Failed to download backup', error);
      throw new Error('Backup download failed');
    }
  }

  /**
   * Validate backup file integrity
   */
  async validateBackup(backupPath: string): Promise<boolean> {
    try {
      logger.info(`Validating backup: ${backupPath}`);

      // Check if file exists
      await fs.access(backupPath);

      // Check if file is not empty
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        logger.error('Backup file is empty');
        return false;
      }

      // Check if file contains SQL content
      const content = await fs.readFile(backupPath, 'utf-8');
      if (!content.includes('PostgreSQL database dump')) {
        logger.error('Backup file does not appear to be a valid PostgreSQL dump');
        return false;
      }

      logger.info('Backup validation successful');
      return true;
    } catch (error) {
      logger.error('Backup validation failed', error);
      return false;
    }
  }

  /**
   * Restore database from backup file
   */
  async restoreBackup(filename: string): Promise<void> {
    try {
      logger.info(`Starting database restore from: ${filename}`);

      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // Download backup from cloud storage
      const backupBuffer = await this.downloadBackup(filename);

      // Save to local file
      const backupPath = path.join(this.backupDir, filename);
      await fs.writeFile(backupPath, backupBuffer);

      // Validate backup integrity
      const isValid = await this.validateBackup(backupPath);
      if (!isValid) {
        await this.deleteLocalBackup(backupPath);
        throw new Error('Backup validation failed');
      }

      // Build psql restore command
      const { host, port, name, user, password } = config.database;
      
      // Drop existing connections and recreate database
      const dropConnectionsCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${name}' AND pid <> pg_backend_pid();"`;
      
      // Restore database
      const restoreCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${name} -f "${backupPath}"`;

      // Execute restore
      logger.info('Terminating existing database connections...');
      await execAsync(dropConnectionsCommand);

      logger.info('Restoring database...');
      await execAsync(restoreCommand);

      // Delete local backup file
      await this.deleteLocalBackup(backupPath);

      logger.info('Database restore completed successfully');
    } catch (error) {
      logger.error('Failed to restore database', error);
      throw new Error('Database restore failed');
    }
  }
}

export const backupService = new BackupService();
