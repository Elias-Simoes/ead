import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { loginRateLimit } from '@shared/middleware/rateLimit.middleware';
import { authenticate } from '@shared/middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student user
 * @access  Public
 */
router.post('/register', (req, res, next) =>
  authController.register(req, res, next)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', loginRateLimit, (req, res, next) =>
  authController.login(req, res, next)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout a user
 * @access  Public
 */
router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, (req, res, next) =>
  authController.me(req, res, next)
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', (req, res, next) =>
  authController.forgotPassword(req, res, next)
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', (req, res, next) =>
  authController.resetPassword(req, res, next)
);

export default router;
