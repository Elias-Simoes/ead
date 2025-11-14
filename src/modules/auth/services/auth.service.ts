import { pool } from '@config/database';
import { passwordService } from './password.service';
import { tokenService, AuthTokens } from './token.service';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { emailQueueService } from '@modules/notifications/services/email-queue.service';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
  isActive: boolean;
  lastAccessAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for handling authentication operations
 */
export class AuthService {
  /**
   * Register a new student user
   * @param data - Registration data
   * @returns Authentication tokens
   */
  async register(data: RegisterInput): Promise<AuthTokens> {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // Hash password
    const passwordHash = await passwordService.hash(data.password);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, name, role, password_hash, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, is_active, created_at`,
      [data.email.toLowerCase(), data.name, 'student', passwordHash, true]
    );

    const user = result.rows[0];

    // Create student record with GDPR consent
    await pool.query(
      `INSERT INTO students (id, gdpr_consent, gdpr_consent_at, subscription_status)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)`,
      [user.id, data.gdprConsent, 'inactive']
    );

    // Generate tokens
    const tokens = await tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Send welcome email (async, don't wait)
    emailQueueService.enqueueWelcomeEmail({
      name: user.name,
      email: user.email,
    }).catch((error) => {
      console.error('Failed to enqueue welcome email:', error);
    });

    return tokens;
  }

  /**
   * Login a user
   * @param data - Login credentials
   * @returns Authentication tokens and user data
   */
  async login(
    data: LoginInput
  ): Promise<{ tokens: AuthTokens; user: Omit<User, 'lastAccessAt'> }> {
    // Find user by email
    const result = await pool.query(
      `SELECT id, email, name, role, password_hash, is_active, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [data.email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('USER_INACTIVE');
    }

    // Verify password
    const isPasswordValid = await passwordService.verify(
      data.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Update last access time
    await pool.query(
      'UPDATE users SET last_access_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const tokens = await tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token
   * @returns New authentication tokens
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const { userId } = await tokenService.verifyRefreshToken(refreshToken);

    // Get user data
    const result = await pool.query(
      `SELECT id, email, name, role, is_active
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('USER_INACTIVE');
    }

    // Revoke old refresh token
    await tokenService.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = await tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return tokens;
  }

  /**
   * Logout a user by revoking their refresh token
   * @param refreshToken - Refresh token to revoke
   */
  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User data
   */
  async getUserById(userId: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, email, name, role, is_active, last_access_at, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.is_active,
      lastAccessAt: user.last_access_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Request password reset
   * @param email - User email
   * @returns Reset token (in production, this should be sent via email)
   */
  async forgotPassword(email: string): Promise<string> {
    // Find user by email
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Don't reveal if user exists or not for security
    if (result.rows.length === 0) {
      // Return a fake token to prevent email enumeration
      return 'token-sent';
    }

    const user = result.rows[0];

    // Generate reset token (UUID)
    const { v4: uuidv4 } = await import('uuid');
    const resetToken = uuidv4();

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store reset token in database
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    // Send password reset email (async, don't wait)
    emailQueueService.enqueuePasswordResetEmail({
      name: user.name,
      email: user.email,
      resetToken,
    }).catch((error) => {
      console.error('Failed to enqueue password reset email:', error);
    });

    return resetToken;
  }

  /**
   * Reset password using reset token
   * @param token - Reset token
   * @param newPassword - New password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid reset token
    const result = await pool.query(
      `SELECT user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('INVALID_RESET_TOKEN');
    }

    const resetToken = result.rows[0];

    // Check if token has been used
    if (resetToken.used_at) {
      throw new Error('TOKEN_ALREADY_USED');
    }

    // Check if token has expired
    if (new Date(resetToken.expires_at) < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }

    // Hash new password
    const passwordHash = await passwordService.hash(newPassword);

    // Update user password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
      [token]
    );

    // Revoke all refresh tokens for security
    await tokenService.revokeAllUserTokens(resetToken.user_id);
  }
}

// Export singleton instance
export const authService = new AuthService();
