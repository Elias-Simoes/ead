import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../validators/auth.validator';
import { logger } from '@shared/utils/logger';
import { AuditService } from '@shared/services/audit.service';

/**
 * Controller for authentication endpoints
 */
export class AuthController {
  /**
   * Register a new student user
   * POST /api/auth/register
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const tokens = await authService.register(validatedData);

      logger.info('User registered successfully', {
        email: validatedData.email,
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: tokens,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'EMAIL_ALREADY_EXISTS') {
          res.status(409).json({
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'Email already registered',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * Login a user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const { tokens, user } = await authService.login(validatedData);

      // Log audit entry
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      await AuditService.logLogin(user.id, ipAddress, userAgent);

      logger.info('User logged in successfully', { userId: user.id });

      res.status(200).json({
        message: 'Login successful',
        data: {
          tokens,
          user,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'INVALID_CREDENTIALS' ||
          error.message === 'USER_INACTIVE'
        ) {
          res.status(401).json({
            error: {
              code: error.message,
              message:
                error.message === 'INVALID_CREDENTIALS'
                  ? 'Invalid email or password'
                  : 'User account is inactive',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body
      const validatedData = refreshTokenSchema.parse(req.body);

      // Refresh token
      const tokens = await authService.refreshToken(
        validatedData.refreshToken
      );

      res.status(200).json({
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'INVALID_REFRESH_TOKEN' ||
          error.message === 'TOKEN_EXPIRED' ||
          error.message === 'TOKEN_REVOKED' ||
          error.message === 'USER_NOT_FOUND' ||
          error.message === 'USER_INACTIVE'
        ) {
          res.status(401).json({
            error: {
              code: error.message,
              message: 'Invalid or expired refresh token',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * Logout a user
   * POST /api/auth/logout
   */
  async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Validate request body
      const validatedData = logoutSchema.parse(req.body);

      // Logout user
      await authService.logout(validatedData.refreshToken);

      // Log audit entry if user is authenticated
      if (req.user) {
        const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        await AuditService.logLogout(req.user.userId, ipAddress, userAgent);
      }

      res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      const user = await authService.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Base user data
      const userData: any = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      // If user is a student, include subscription information
      if (user.role === 'student') {
        const { studentService } = await import('@modules/users/services/student.service');
        const studentProfile = await studentService.getStudentProfile(user.id);
        
        if (studentProfile) {
          userData.subscriptionStatus = studentProfile.subscription_status;
          userData.subscriptionExpiresAt = studentProfile.subscription_expires_at;
        }
      }

      res.status(200).json(userData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { forgotPasswordSchema } = await import(
        '../validators/auth.validator'
      );
      const validatedData = forgotPasswordSchema.parse(req.body);

      await authService.forgotPassword(validatedData.email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        message:
          'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { resetPasswordSchema } = await import(
        '../validators/auth.validator'
      );
      const validatedData = resetPasswordSchema.parse(req.body);

      await authService.resetPassword(
        validatedData.token,
        validatedData.password
      );

      // Note: Password change is logged in the auth service
      // Could enhance to return userId and log here as well

      res.status(200).json({
        message: 'Password reset successful',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'INVALID_RESET_TOKEN' ||
          error.message === 'TOKEN_ALREADY_USED' ||
          error.message === 'TOKEN_EXPIRED'
        ) {
          res.status(400).json({
            error: {
              code: error.message,
              message: 'Invalid or expired reset token',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
          return;
        }
      }
      next(error);
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
