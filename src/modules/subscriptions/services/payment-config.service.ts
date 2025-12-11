import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { cacheService } from '@shared/services/cache.service';

export interface PaymentConfig {
  id: string;
  maxInstallments: number;
  pixDiscountPercent: number;
  installmentsWithoutInterest: number;
  pixExpirationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePaymentConfigData {
  maxInstallments?: number;
  pixDiscountPercent?: number;
  installmentsWithoutInterest?: number;
  pixExpirationMinutes?: number;
}

/**
 * Payment Configuration Service
 * Manages payment configuration settings with in-memory caching
 */
export class PaymentConfigService {
  private readonly CACHE_KEY = 'payment:config';
  private readonly CACHE_TTL = 300; // 5 minutes
  
  // In-memory cache
  private memoryCache: PaymentConfig | null = null;
  private memoryCacheTimestamp: number = 0;

  /**
   * Get current payment configuration
   * Uses in-memory cache first, then Redis, then database
   */
  async getConfig(): Promise<PaymentConfig> {
    try {
      // Check in-memory cache first (fastest)
      const now = Date.now();
      if (this.memoryCache && (now - this.memoryCacheTimestamp) < this.CACHE_TTL * 1000) {
        logger.debug('Payment config retrieved from memory cache');
        return this.memoryCache;
      }

      // Check Redis cache
      const cachedConfig = await cacheService.get<PaymentConfig>(this.CACHE_KEY);
      if (cachedConfig) {
        logger.debug('Payment config retrieved from Redis cache');
        this.memoryCache = cachedConfig;
        this.memoryCacheTimestamp = now;
        return cachedConfig;
      }

      // Fetch from database
      const result = await pool.query(
        `SELECT 
          id,
          max_installments as "maxInstallments",
          pix_discount_percent as "pixDiscountPercent",
          installments_without_interest as "installmentsWithoutInterest",
          pix_expiration_minutes as "pixExpirationMinutes",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM payment_config
        ORDER BY created_at DESC
        LIMIT 1`
      );

      if (result.rows.length === 0) {
        throw new Error('CONFIG_NOT_FOUND');
      }

      const config = result.rows[0] as PaymentConfig;

      // Update both caches
      await cacheService.set(this.CACHE_KEY, config, this.CACHE_TTL);
      this.memoryCache = config;
      this.memoryCacheTimestamp = now;

      logger.info('Payment config retrieved from database');
      return config;
    } catch (error) {
      logger.error('Failed to get payment config', error);
      throw error;
    }
  }

  /**
   * Update payment configuration
   * Validates values and clears cache
   */
  async updateConfig(data: UpdatePaymentConfigData): Promise<PaymentConfig> {
    try {
      // Validate values
      this.validateConfigData(data);

      // Get current config to merge with updates
      const currentConfig = await this.getConfig();

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.maxInstallments !== undefined) {
        updates.push(`max_installments = $${paramIndex++}`);
        values.push(data.maxInstallments);
      }

      if (data.pixDiscountPercent !== undefined) {
        updates.push(`pix_discount_percent = $${paramIndex++}`);
        values.push(data.pixDiscountPercent);
      }

      if (data.installmentsWithoutInterest !== undefined) {
        updates.push(`installments_without_interest = $${paramIndex++}`);
        values.push(data.installmentsWithoutInterest);
      }

      if (data.pixExpirationMinutes !== undefined) {
        updates.push(`pix_expiration_minutes = $${paramIndex++}`);
        values.push(data.pixExpirationMinutes);
      }

      if (updates.length === 0) {
        return currentConfig;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(currentConfig.id);

      const query = `
        UPDATE payment_config
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING 
          id,
          max_installments as "maxInstallments",
          pix_discount_percent as "pixDiscountPercent",
          installments_without_interest as "installmentsWithoutInterest",
          pix_expiration_minutes as "pixExpirationMinutes",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;

      const result = await pool.query(query, values);
      const updatedConfig = result.rows[0] as PaymentConfig;

      // Clear both caches
      await this.clearCache();

      logger.info('Payment config updated', { updates: data });
      return updatedConfig;
    } catch (error) {
      logger.error('Failed to update payment config', error);
      throw error;
    }
  }

  /**
   * Validate configuration data
   * Ensures values are within acceptable ranges
   */
  private validateConfigData(data: UpdatePaymentConfigData): void {
    if (data.maxInstallments !== undefined) {
      if (data.maxInstallments < 1 || data.maxInstallments > 24) {
        throw new Error('INVALID_MAX_INSTALLMENTS: Must be between 1 and 24');
      }
    }

    if (data.pixDiscountPercent !== undefined) {
      if (data.pixDiscountPercent < 0 || data.pixDiscountPercent > 50) {
        throw new Error('INVALID_PIX_DISCOUNT: Must be between 0 and 50');
      }
    }

    if (data.installmentsWithoutInterest !== undefined) {
      if (data.installmentsWithoutInterest < 0) {
        throw new Error('INVALID_INSTALLMENTS_WITHOUT_INTEREST: Must be >= 0');
      }
      if (data.maxInstallments !== undefined && 
          data.installmentsWithoutInterest > data.maxInstallments) {
        throw new Error('INVALID_INSTALLMENTS_WITHOUT_INTEREST: Cannot exceed max installments');
      }
    }

    if (data.pixExpirationMinutes !== undefined) {
      if (data.pixExpirationMinutes < 5 || data.pixExpirationMinutes > 1440) {
        throw new Error('INVALID_PIX_EXPIRATION: Must be between 5 and 1440 minutes');
      }
    }
  }

  /**
   * Clear all caches (memory and Redis)
   */
  private async clearCache(): Promise<void> {
    this.memoryCache = null;
    this.memoryCacheTimestamp = 0;
    await cacheService.delete(this.CACHE_KEY);
    logger.debug('Payment config cache cleared');
  }
}

export const paymentConfigService = new PaymentConfigService();
