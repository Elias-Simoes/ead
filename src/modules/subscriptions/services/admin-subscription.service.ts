import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { Subscription } from './subscription.service';

export interface SubscriptionFilters {
  status?: string;
  planId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface SubscriptionStats {
  totalActive: number;
  totalSuspended: number;
  totalCancelled: number;
  totalPending: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  newSubscriptionsThisMonth: number;
  cancelledThisMonth: number;
}

export class AdminSubscriptionService {
  /**
   * Get all subscriptions with filters and pagination
   */
  async getAllSubscriptions(
    filters: SubscriptionFilters
  ): Promise<{
    subscriptions: Subscription[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.status) {
        conditions.push(`s.status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.planId) {
        conditions.push(`s.plan_id = $${paramIndex}`);
        params.push(filters.planId);
        paramIndex++;
      }

      if (filters.startDate) {
        conditions.push(`s.created_at >= $${paramIndex}`);
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        conditions.push(`s.created_at <= $${paramIndex}`);
        params.push(filters.endDate);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM subscriptions s ${whereClause}`,
        params
      );

      const total = parseInt(countResult.rows[0].total);

      // Get subscriptions
      const result = await pool.query(
        `SELECT 
          s.*,
          u.name as student_name,
          u.email as student_email,
          p.name as plan_name,
          p.price as plan_price,
          p.currency as plan_currency
         FROM subscriptions s
         LEFT JOIN students st ON s.student_id = st.id
         LEFT JOIN users u ON st.id = u.id
         LEFT JOIN plans p ON s.plan_id = p.id
         ${whereClause}
         ORDER BY s.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const subscriptions = result.rows.map((row) => ({
        id: row.id,
        student_id: row.student_id,
        plan_id: row.plan_id,
        status: row.status,
        current_period_start: row.current_period_start,
        current_period_end: row.current_period_end,
        cancelled_at: row.cancelled_at,
        gateway_subscription_id: row.gateway_subscription_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        student_name: row.student_name,
        student_email: row.student_email,
        plan: {
          id: row.plan_id,
          name: row.plan_name,
          price: parseFloat(row.plan_price),
          currency: row.plan_currency,
          interval: 'monthly',
          is_active: true,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      }));

      return {
        subscriptions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get all subscriptions', error);
      throw error;
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      // Get status counts
      const statusResult = await pool.query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM subscriptions
        GROUP BY status
      `);

      const statusCounts: Record<string, number> = {};
      statusResult.rows.forEach((row) => {
        statusCounts[row.status] = parseInt(row.count);
      });

      // Calculate MRR (Monthly Recurring Revenue)
      const mrrResult = await pool.query(`
        SELECT 
          COALESCE(SUM(p.price), 0) as mrr
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
        AND p.interval = 'monthly'
      `);

      const mrr = parseFloat(mrrResult.rows[0].mrr);

      // Get new subscriptions this month
      const newSubsResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `);

      const newSubscriptionsThisMonth = parseInt(newSubsResult.rows[0].count);

      // Get cancelled subscriptions this month
      const cancelledResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE cancelled_at >= DATE_TRUNC('month', CURRENT_DATE)
      `);

      const cancelledThisMonth = parseInt(cancelledResult.rows[0].count);

      // Calculate churn rate (cancelled / total active at start of month)
      const startOfMonthActiveResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE status = 'active'
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
      `);

      const startOfMonthActive = parseInt(startOfMonthActiveResult.rows[0].count);
      const churnRate =
        startOfMonthActive > 0
          ? (cancelledThisMonth / startOfMonthActive) * 100
          : 0;

      return {
        totalActive: statusCounts['active'] || 0,
        totalSuspended: statusCounts['suspended'] || 0,
        totalCancelled: statusCounts['cancelled'] || 0,
        totalPending: statusCounts['pending'] || 0,
        monthlyRecurringRevenue: mrr,
        churnRate: parseFloat(churnRate.toFixed(2)),
        newSubscriptionsThisMonth,
        cancelledThisMonth,
      };
    } catch (error) {
      logger.error('Failed to get subscription stats', error);
      throw error;
    }
  }
}

export const adminSubscriptionService = new AdminSubscriptionService();
