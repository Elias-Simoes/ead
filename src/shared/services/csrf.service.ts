import crypto from 'crypto';
import { redisClient } from '@config/redis';
import { logger } from '@shared/utils/logger';

/**
 * CSRF Token Service
 * Generates and validates CSRF tokens for form protection
 */
export class CsrfService {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_TTL = 3600; // 1 hour in seconds
  private static readonly KEY_PREFIX = 'csrf:';

  /**
   * Generate a new CSRF token for a user session
   * @param sessionId - Unique session identifier
   * @returns CSRF token
   */
  static async generateToken(sessionId: string): Promise<string> {
    try {
      // Generate random token
      const token = crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');

      // Store token in Redis with expiration
      const key = `${this.KEY_PREFIX}${sessionId}`;
      await redisClient.set(key, token, {
        EX: this.TOKEN_TTL,
      });

      logger.debug('CSRF token generated', { sessionId });
      return token;
    } catch (error) {
      logger.error('Error generating CSRF token', error);
      throw new Error('Failed to generate CSRF token');
    }
  }

  /**
   * Validate a CSRF token
   * @param sessionId - Unique session identifier
   * @param token - CSRF token to validate
   * @returns true if valid, false otherwise
   */
  static async validateToken(
    sessionId: string,
    token: string
  ): Promise<boolean> {
    try {
      const key = `${this.KEY_PREFIX}${sessionId}`;
      const storedToken = await redisClient.get(key);

      if (!storedToken) {
        logger.warn('CSRF token not found or expired', { sessionId });
        return false;
      }

      // Use timing-safe comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(storedToken),
        Buffer.from(token)
      );

      if (!isValid) {
        logger.warn('Invalid CSRF token', { sessionId });
      }

      return isValid;
    } catch (error) {
      logger.error('Error validating CSRF token', error);
      return false;
    }
  }

  /**
   * Delete a CSRF token
   * @param sessionId - Unique session identifier
   */
  static async deleteToken(sessionId: string): Promise<void> {
    try {
      const key = `${this.KEY_PREFIX}${sessionId}`;
      await redisClient.del(key);
      logger.debug('CSRF token deleted', { sessionId });
    } catch (error) {
      logger.error('Error deleting CSRF token', error);
    }
  }

  /**
   * Refresh a CSRF token (extend TTL)
   * @param sessionId - Unique session identifier
   */
  static async refreshToken(sessionId: string): Promise<void> {
    try {
      const key = `${this.KEY_PREFIX}${sessionId}`;
      await redisClient.expire(key, this.TOKEN_TTL);
      logger.debug('CSRF token refreshed', { sessionId });
    } catch (error) {
      logger.error('Error refreshing CSRF token', error);
    }
  }
}
