import jwt from 'jsonwebtoken';
import { config } from '@config/env';
import { pool } from '@config/database';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Service for handling JWT token generation and validation
 */
export class TokenService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.jwtSecret = config.jwt.secret;
    this.accessTokenExpiresIn = config.jwt.accessTokenExpiresIn;
    this.refreshTokenExpiresIn = config.jwt.refreshTokenExpiresIn;
  }

  /**
   * Generate access and refresh tokens for a user
   * @param payload - Token payload containing user information
   * @returns Object containing access token, refresh token, and expiration time
   */
  async generateTokens(payload: TokenPayload): Promise<AuthTokens> {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      payload,
      this.jwtSecret,
      {
        expiresIn: this.accessTokenExpiresIn,
      } as jwt.SignOptions
    );

    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId: payload.userId, tokenId: uuidv4() },
      this.jwtSecret,
      {
        expiresIn: this.refreshTokenExpiresIn,
      } as jwt.SignOptions
    );

    // Store refresh token in database
    await this.storeRefreshToken(payload.userId, refreshToken);

    // Calculate expiration time in seconds
    const expiresIn = this.parseExpirationTime(this.accessTokenExpiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify and decode an access token
   * @param token - JWT token to verify
   * @returns Decoded token payload
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Verify and decode a refresh token
   * @param token - Refresh token to verify
   * @returns Decoded token payload with userId
   */
  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, this.jwtSecret) as {
        userId: string;
        tokenId: string;
      };

      // Check if token exists in database and is not revoked
      const result = await pool.query(
        `SELECT user_id, revoked_at, expires_at 
         FROM refresh_tokens 
         WHERE token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      const tokenData = result.rows[0];

      if (tokenData.revoked_at) {
        throw new Error('TOKEN_REVOKED');
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        throw new Error('TOKEN_EXPIRED');
      }

      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Revoke a refresh token
   * @param token - Refresh token to revoke
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await pool.query(
      `UPDATE refresh_tokens 
       SET revoked_at = CURRENT_TIMESTAMP 
       WHERE token = $1`,
      [token]
    );
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId - User ID whose tokens should be revoked
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await pool.query(
      `UPDATE refresh_tokens 
       SET revoked_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }

  /**
   * Store refresh token in database
   * @param userId - User ID
   * @param token - Refresh token
   */
  private async storeRefreshToken(
    userId: string,
    token: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + this.parseExpirationDays(this.refreshTokenExpiresIn)
    );

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  }

  /**
   * Parse expiration time string to seconds
   * @param expiresIn - Expiration time string (e.g., '15m', '7d')
   * @returns Expiration time in seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // Default 15 minutes
    }
  }

  /**
   * Parse expiration time string to days
   * @param expiresIn - Expiration time string (e.g., '7d')
   * @returns Expiration time in days
   */
  private parseExpirationDays(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 'd':
        return value;
      case 'h':
        return value / 24;
      case 'm':
        return value / (24 * 60);
      default:
        return 7; // Default 7 days
    }
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await pool.query(
      `DELETE FROM refresh_tokens 
       WHERE expires_at < CURRENT_TIMESTAMP`
    );
  }
}

// Export singleton instance
export const tokenService = new TokenService();
