import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';
import crypto from 'crypto';

export interface UploadFileOptions {
  folder: string;
  filename?: string;
  contentType?: string;
  isPublic?: boolean;
}

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    // Initialize S3 client based on provider
    if (config.storage.provider === 'cloudflare') {
      // Cloudflare R2 configuration
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${config.storage.cloudflare.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.storage.cloudflare.accessKeyId,
          secretAccessKey: config.storage.cloudflare.secretAccessKey,
        },
      });
      this.bucket = config.storage.cloudflare.bucket;
    } else {
      // AWS S3 configuration
      this.s3Client = new S3Client({
        region: config.storage.aws.region,
        credentials: {
          accessKeyId: config.storage.aws.accessKeyId,
          secretAccessKey: config.storage.aws.secretAccessKey,
        },
      });
      this.bucket = config.storage.aws.s3Bucket;
    }
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: UploadFileOptions
  ): Promise<UploadResult> {
    try {
      // Generate unique filename if not provided
      const filename = options.filename || this.generateUniqueFilename();
      const key = `${options.folder}/${filename}`;

      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (fileBuffer.length > maxSize) {
        throw new Error('FILE_TOO_LARGE');
      }

      // Validate content type if provided
      if (options.contentType) {
        this.validateContentType(options.contentType);
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: options.contentType,
        ACL: options.isPublic ? 'public-read' : 'private',
      });

      await this.s3Client.send(command);

      // Generate public URL
      const url = this.getPublicUrl(key);

      logger.info('File uploaded successfully', {
        key,
        bucket: this.bucket,
        size: fileBuffer.length,
      });

      return {
        url,
        key,
        bucket: this.bucket,
      };
    } catch (error) {
      logger.error('Failed to upload file', error);
      throw error;
    }
  }

  /**
   * Get a signed URL for private file access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL', error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      logger.info('File deleted successfully', { key, bucket: this.bucket });
    } catch (error) {
      logger.error('Failed to delete file', error);
      throw error;
    }
  }

  /**
   * Generate a unique filename
   */
  private generateUniqueFilename(extension?: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = extension || '';
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Get public URL for a file
   */
  private getPublicUrl(key: string): string {
    if (config.cdn.url) {
      return `${config.cdn.url}/${key}`;
    }

    if (config.storage.provider === 'cloudflare') {
      return `https://${this.bucket}.r2.dev/${key}`;
    }

    // AWS S3 public URL
    return `https://${this.bucket}.s3.${config.storage.aws.region}.amazonaws.com/${key}`;
  }

  /**
   * Validate content type
   */
  private validateContentType(contentType: string): void {
    const allowedTypes = [
      // Videos
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
    ];

    if (!allowedTypes.includes(contentType)) {
      throw new Error('INVALID_FILE_TYPE');
    }
  }

  /**
   * Get file extension from content type
   */
  getExtensionFromContentType(contentType: string): string {
    const extensions: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/ogg': '.ogg',
      'video/quicktime': '.mov',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'text/plain': '.txt',
    };

    return extensions[contentType] || '';
  }
}

export const storageService = new StorageService();
