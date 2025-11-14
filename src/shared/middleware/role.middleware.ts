import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has required role(s)
 * Must be used after authMiddleware
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated (should be set by authMiddleware)
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // Check if user has one of the allowed roles
      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }

      // User has required role, proceed
      next();
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error checking user role',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }
  };
};

/**
 * Convenience middleware for admin-only routes
 */
export const adminOnly = roleMiddleware(['admin']);

/**
 * Convenience middleware for instructor-only routes
 */
export const instructorOnly = roleMiddleware(['instructor']);

/**
 * Convenience middleware for student-only routes
 */
export const studentOnly = roleMiddleware(['student']);

/**
 * Middleware for routes accessible by instructors and admins
 */
export const instructorOrAdmin = roleMiddleware(['instructor', 'admin']);

/**
 * Middleware for routes accessible by students and admins
 */
export const studentOrAdmin = roleMiddleware(['student', 'admin']);
