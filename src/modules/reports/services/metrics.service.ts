import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';

export interface MetricsFilters {
  startDate?: Date;
  endDate?: Date;
}

export interface SubscriptionMetrics {
  totalActiveSubscribers: number;
  newSubscribersInPeriod: number;
  retentionRate: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
}

export interface CourseMetrics {
  courseId: string;
  courseTitle: string;
  totalAccesses: number;
  totalCompletions: number;
  completionRate: number;
  averageRating?: number;
}

export class MetricsService {
  /**
   * Calculate total active subscribers
   */
  async getTotalActiveSubscribers(): Promise<number> {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE status = 'active'
      `);

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to get total active subscribers', error);
      throw error;
    }
  }

  /**
   * Calculate new subscribers in a given period
   */
  async getNewSubscribersInPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      const result = await pool.query(
        `
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE created_at >= $1 AND created_at <= $2
      `,
        [startDate, endDate]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to get new subscribers in period', error);
      throw error;
    }
  }

  /**
   * Calculate retention rate (1 - churn rate)
   * Retention rate = (subscribers at end - new subscribers) / subscribers at start
   */
  async getRetentionRate(startDate: Date, endDate: Date): Promise<number> {
    try {
      // Get subscribers at start of period
      const startResult = await pool.query(
        `
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE created_at < $1
        AND (cancelled_at IS NULL OR cancelled_at >= $1)
      `,
        [startDate]
      );

      const subscribersAtStart = parseInt(startResult.rows[0].count);

      if (subscribersAtStart === 0) {
        return 100; // No subscribers to retain
      }

      // Get subscribers who cancelled during the period
      const cancelledResult = await pool.query(
        `
        SELECT COUNT(*) as count
        FROM subscriptions
        WHERE cancelled_at >= $1 AND cancelled_at <= $2
        AND created_at < $1
      `,
        [startDate, endDate]
      );

      const cancelledInPeriod = parseInt(cancelledResult.rows[0].count);

      // Retention rate = (1 - churn rate) * 100
      const churnRate = cancelledInPeriod / subscribersAtStart;
      const retentionRate = (1 - churnRate) * 100;

      return parseFloat(retentionRate.toFixed(2));
    } catch (error) {
      logger.error('Failed to calculate retention rate', error);
      throw error;
    }
  }

  /**
   * Calculate churn rate
   * Churn rate = cancelled subscribers / total subscribers at start of period
   */
  async getChurnRate(startDate: Date, endDate: Date): Promise<number> {
    try {
      const retentionRate = await this.getRetentionRate(startDate, endDate);
      const churnRate = 100 - retentionRate;

      return parseFloat(churnRate.toFixed(2));
    } catch (error) {
      logger.error('Failed to calculate churn rate', error);
      throw error;
    }
  }

  /**
   * Calculate Monthly Recurring Revenue (MRR)
   */
  async getMonthlyRecurringRevenue(): Promise<number> {
    try {
      const result = await pool.query(`
        SELECT COALESCE(SUM(p.price), 0) as mrr
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
        AND p.interval = 'monthly'
      `);

      return parseFloat(result.rows[0].mrr);
    } catch (error) {
      logger.error('Failed to calculate MRR', error);
      throw error;
    }
  }

  /**
   * Get most accessed courses
   */
  async getMostAccessedCourses(limit: number = 10): Promise<CourseMetrics[]> {
    try {
      const result = await pool.query(
        `
        SELECT 
          c.id as course_id,
          c.title as course_title,
          COUNT(DISTINCT sp.student_id) as total_accesses,
          COUNT(DISTINCT CASE WHEN sp.progress_percentage = 100 THEN sp.student_id END) as total_completions,
          CASE 
            WHEN COUNT(DISTINCT sp.student_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN sp.progress_percentage = 100 THEN sp.student_id END)::float / COUNT(DISTINCT sp.student_id)::float * 100)
            ELSE 0 
          END as completion_rate
        FROM courses c
        LEFT JOIN student_progress sp ON c.id = sp.course_id
        WHERE c.status = 'published'
        GROUP BY c.id, c.title
        ORDER BY total_accesses DESC
        LIMIT $1
      `,
        [limit]
      );

      return result.rows.map((row) => ({
        courseId: row.course_id,
        courseTitle: row.course_title,
        totalAccesses: parseInt(row.total_accesses),
        totalCompletions: parseInt(row.total_completions),
        completionRate: parseFloat(parseFloat(row.completion_rate).toFixed(2)),
      }));
    } catch (error) {
      logger.error('Failed to get most accessed courses', error);
      throw error;
    }
  }

  /**
   * Get comprehensive subscription metrics
   */
  async getSubscriptionMetrics(
    filters: MetricsFilters = {}
  ): Promise<SubscriptionMetrics> {
    try {
      const now = new Date();
      const startDate =
        filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = filters.endDate || now;

      const [
        totalActiveSubscribers,
        newSubscribersInPeriod,
        retentionRate,
        churnRate,
        monthlyRecurringRevenue,
      ] = await Promise.all([
        this.getTotalActiveSubscribers(),
        this.getNewSubscribersInPeriod(startDate, endDate),
        this.getRetentionRate(startDate, endDate),
        this.getChurnRate(startDate, endDate),
        this.getMonthlyRecurringRevenue(),
      ]);

      return {
        totalActiveSubscribers,
        newSubscribersInPeriod,
        retentionRate,
        churnRate,
        monthlyRecurringRevenue,
      };
    } catch (error) {
      logger.error('Failed to get subscription metrics', error);
      throw error;
    }
  }
}

export const metricsService = new MetricsService();
