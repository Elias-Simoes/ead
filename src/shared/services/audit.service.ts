import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Service
 * Logs critical actions for security and compliance
 */
export class AuditService {
  /**
   * Log an audit entry
   * @param entry - Audit log entry
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO audit_logs 
         (user_id, action, resource, resource_id, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entry.userId || null,
          entry.action,
          entry.resource,
          entry.resourceId || null,
          entry.details ? JSON.stringify(entry.details) : null,
          entry.ipAddress || null,
          entry.userAgent || null,
        ]
      );

      logger.info('Audit log created', {
        action: entry.action,
        resource: entry.resource,
        userId: entry.userId,
      });
    } catch (error) {
      // Don't throw error to avoid breaking the main flow
      logger.error('Error creating audit log', error);
    }
  }

  /**
   * Log user login
   */
  static async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user logout
   */
  static async logLogout(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user creation
   */
  static async logUserCreation(
    createdBy: string,
    newUserId: string,
    role: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId: createdBy,
      action: 'CREATE_USER',
      resource: 'user',
      resourceId: newUserId,
      details: { role },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user suspension
   */
  static async logUserSuspension(
    suspendedBy: string,
    suspendedUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId: suspendedBy,
      action: 'SUSPEND_USER',
      resource: 'user',
      resourceId: suspendedUserId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log user reactivation
   */
  static async logUserReactivation(
    reactivatedBy: string,
    reactivatedUserId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId: reactivatedBy,
      action: 'REACTIVATE_USER',
      resource: 'user',
      resourceId: reactivatedUserId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log role change
   */
  static async logRoleChange(
    changedBy: string,
    targetUserId: string,
    oldRole: string,
    newRole: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId: changedBy,
      action: 'CHANGE_ROLE',
      resource: 'user',
      resourceId: targetUserId,
      details: { oldRole, newRole },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log password change
   */
  static async logPasswordChange(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CHANGE_PASSWORD',
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log password reset request
   */
  static async logPasswordResetRequest(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'REQUEST_PASSWORD_RESET',
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log course approval
   */
  static async logCourseApproval(
    approvedBy: string,
    courseId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId: approvedBy,
      action: 'APPROVE_COURSE',
      resource: 'course',
      resourceId: courseId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log course rejection
   */
  static async logCourseRejection(
    rejectedBy: string,
    courseId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId: rejectedBy,
      action: 'REJECT_COURSE',
      resource: 'course',
      resourceId: courseId,
      details: { reason },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log subscription cancellation
   */
  static async logSubscriptionCancellation(
    userId: string,
    subscriptionId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'CANCEL_SUBSCRIPTION',
      resource: 'subscription',
      resourceId: subscriptionId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log GDPR data access request
   */
  static async logGdprDataAccess(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'GDPR_DATA_ACCESS',
      resource: 'gdpr',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log GDPR account deletion request
   */
  static async logGdprDeletionRequest(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'GDPR_DELETION_REQUEST',
      resource: 'gdpr',
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log GDPR account deletion completion
   */
  static async logGdprDeletionComplete(
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'GDPR_DELETION_COMPLETE',
      resource: 'gdpr',
      ipAddress,
    });
  }

  /**
   * Get audit logs for a user
   * @param userId - User ID
   * @param limit - Maximum number of logs to return
   */
  static async getUserLogs(
    userId: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM audit_logs 
         WHERE user_id = $1 
         ORDER BY timestamp DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching user audit logs', error);
      return [];
    }
  }

  /**
   * Get audit logs for a resource
   * @param resource - Resource type
   * @param resourceId - Resource ID
   * @param limit - Maximum number of logs to return
   */
  static async getResourceLogs(
    resource: string,
    resourceId: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM audit_logs 
         WHERE resource = $1 AND resource_id = $2 
         ORDER BY timestamp DESC 
         LIMIT $3`,
        [resource, resourceId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching resource audit logs', error);
      return [];
    }
  }

  /**
   * Get recent audit logs
   * @param limit - Maximum number of logs to return
   */
  static async getRecentLogs(limit: number = 100): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT al.*, u.email, u.name 
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.timestamp DESC 
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching recent audit logs', error);
      return [];
    }
  }
}
