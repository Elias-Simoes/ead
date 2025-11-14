import { pool } from '@config/database';
import { logger } from '@shared/utils/logger';
import { metricsService } from './metrics.service';
import { gatewayIntegrationService } from './gateway-integration.service';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
}

export interface OverviewReport {
  subscriptions: {
    totalActive: number;
    newInPeriod: number;
    retentionRate: number;
    churnRate: number;
    mrr: number;
  };
  courses: {
    totalPublished: number;
    totalInProgress: number;
    totalCompleted: number;
  };
  students: {
    totalActive: number;
    totalStudyTime: number;
  };
  certificates: {
    totalIssued: number;
    issuedInPeriod: number;
  };
}

export interface SubscriptionReport {
  totalSubscriptions: number;
  activeSubscriptions: number;
  suspendedSubscriptions: number;
  cancelledSubscriptions: number;
  subscriptionsByPlan: Array<{
    planId: string;
    planName: string;
    count: number;
    revenue: number;
  }>;
  subscriptionTrend: Array<{
    date: string;
    newSubscriptions: number;
    cancelledSubscriptions: number;
  }>;
}

export interface CourseReport {
  totalCourses: number;
  publishedCourses: number;
  mostAccessedCourses: Array<{
    courseId: string;
    courseTitle: string;
    instructorName: string;
    totalAccesses: number;
    totalCompletions: number;
    completionRate: number;
    averageProgress: number;
  }>;
  coursesByCategory: Array<{
    category: string;
    count: number;
  }>;
}

export interface FinancialReport {
  totalRevenue: number;
  revenueInPeriod: number;
  mrr: number;
  averageRevenuePerUser: number;
  revenueByPlan: Array<{
    planId: string;
    planName: string;
    revenue: number;
    subscribers: number;
  }>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
  }>;
  projectedMRR: number;
  gatewayData?: {
    totalPaymentsFromGateway: number;
    totalRevenueFromGateway: number;
    successfulPayments: number;
    failedPayments: number;
    refundedPayments: number;
    averageTransactionValue: number;
    paymentSuccessRate: number;
    refundRate: number;
  };
}

export class ReportService {
  /**
   * Generate overview report with key metrics
   */
  async getOverviewReport(filters: ReportFilters = {}): Promise<OverviewReport> {
    try {
      const now = new Date();
      const startDate =
        filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = filters.endDate || now;

      // Get subscription metrics
      const subscriptionMetrics = await metricsService.getSubscriptionMetrics({
        startDate,
        endDate,
      });

      // Get course statistics
      const coursesResult = await pool.query(`
        SELECT 
          COUNT(CASE WHEN status = 'published' THEN 1 END) as total_published,
          COUNT(CASE WHEN status = 'draft' OR status = 'pending_approval' THEN 1 END) as total_in_progress
        FROM courses
      `);

      const completedCoursesResult = await pool.query(
        `
        SELECT COUNT(DISTINCT course_id) as total_completed
        FROM student_progress
        WHERE progress_percentage = 100
        AND completed_at >= $1 AND completed_at <= $2
      `,
        [startDate, endDate]
      );

      // Get student statistics
      const studentsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_active,
          COALESCE(SUM(total_study_time), 0) as total_study_time
        FROM students s
        JOIN subscriptions sub ON s.id = sub.student_id
        WHERE sub.status = 'active'
      `);

      // Get certificate statistics
      const certificatesResult = await pool.query(
        `
        SELECT 
          COUNT(*) as total_issued,
          COUNT(CASE WHEN issued_at >= $1 AND issued_at <= $2 THEN 1 END) as issued_in_period
        FROM certificates
      `,
        [startDate, endDate]
      );

      return {
        subscriptions: {
          totalActive: subscriptionMetrics.totalActiveSubscribers,
          newInPeriod: subscriptionMetrics.newSubscribersInPeriod,
          retentionRate: subscriptionMetrics.retentionRate,
          churnRate: subscriptionMetrics.churnRate,
          mrr: subscriptionMetrics.monthlyRecurringRevenue,
        },
        courses: {
          totalPublished: parseInt(coursesResult.rows[0].total_published),
          totalInProgress: parseInt(coursesResult.rows[0].total_in_progress),
          totalCompleted: parseInt(completedCoursesResult.rows[0].total_completed),
        },
        students: {
          totalActive: parseInt(studentsResult.rows[0].total_active),
          totalStudyTime: parseInt(studentsResult.rows[0].total_study_time),
        },
        certificates: {
          totalIssued: parseInt(certificatesResult.rows[0].total_issued),
          issuedInPeriod: parseInt(certificatesResult.rows[0].issued_in_period),
        },
      };
    } catch (error) {
      logger.error('Failed to generate overview report', error);
      throw error;
    }
  }

  /**
   * Generate detailed subscription report
   */
  async getSubscriptionReport(
    filters: ReportFilters = {}
  ): Promise<SubscriptionReport> {
    try {
      const now = new Date();
      const startDate =
        filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = filters.endDate || now;

      // Get subscription counts by status
      const statusResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM subscriptions
      `);

      // Get subscriptions by plan
      const planResult = await pool.query(`
        SELECT 
          p.id as plan_id,
          p.name as plan_name,
          COUNT(s.id) as count,
          SUM(p.price) as revenue
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
        GROUP BY p.id, p.name
        ORDER BY count DESC
      `);

      // Get subscription trend
      const trendResult = await pool.query(
        `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_subscriptions,
          0 as cancelled_subscriptions
        FROM subscriptions
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY DATE(created_at)
        
        UNION ALL
        
        SELECT 
          DATE(cancelled_at) as date,
          0 as new_subscriptions,
          COUNT(*) as cancelled_subscriptions
        FROM subscriptions
        WHERE cancelled_at >= $1 AND cancelled_at <= $2
        GROUP BY DATE(cancelled_at)
        
        ORDER BY date
      `,
        [startDate, endDate]
      );

      // Aggregate trend data by date
      const trendMap = new Map<string, { newSubscriptions: number; cancelledSubscriptions: number }>();
      trendResult.rows.forEach((row) => {
        const dateStr = row.date.toISOString().split('T')[0];
        const existing = trendMap.get(dateStr) || { newSubscriptions: 0, cancelledSubscriptions: 0 };
        existing.newSubscriptions += parseInt(row.new_subscriptions);
        existing.cancelledSubscriptions += parseInt(row.cancelled_subscriptions);
        trendMap.set(dateStr, existing);
      });

      const subscriptionTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        newSubscriptions: data.newSubscriptions,
        cancelledSubscriptions: data.cancelledSubscriptions,
      }));

      return {
        totalSubscriptions: parseInt(statusResult.rows[0].total),
        activeSubscriptions: parseInt(statusResult.rows[0].active),
        suspendedSubscriptions: parseInt(statusResult.rows[0].suspended),
        cancelledSubscriptions: parseInt(statusResult.rows[0].cancelled),
        subscriptionsByPlan: planResult.rows.map((row) => ({
          planId: row.plan_id,
          planName: row.plan_name,
          count: parseInt(row.count),
          revenue: parseFloat(row.revenue),
        })),
        subscriptionTrend,
      };
    } catch (error) {
      logger.error('Failed to generate subscription report', error);
      throw error;
    }
  }

  /**
   * Generate detailed course report
   */
  async getCourseReport(_filters: ReportFilters = {}): Promise<CourseReport> {
    try {
      // Get total course counts
      const countResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published
        FROM courses
      `);

      // Get most accessed courses with detailed metrics
      const coursesResult = await pool.query(`
        SELECT 
          c.id as course_id,
          c.title as course_title,
          u.name as instructor_name,
          COUNT(DISTINCT sp.student_id) as total_accesses,
          COUNT(DISTINCT CASE WHEN sp.progress_percentage = 100 THEN sp.student_id END) as total_completions,
          CASE 
            WHEN COUNT(DISTINCT sp.student_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN sp.progress_percentage = 100 THEN sp.student_id END)::float / COUNT(DISTINCT sp.student_id)::float * 100)
            ELSE 0 
          END as completion_rate,
          COALESCE(AVG(sp.progress_percentage), 0) as average_progress
        FROM courses c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        LEFT JOIN users u ON i.id = u.id
        LEFT JOIN student_progress sp ON c.id = sp.course_id
        WHERE c.status = 'published'
        GROUP BY c.id, c.title, u.name
        ORDER BY total_accesses DESC
        LIMIT 20
      `);

      // Get courses by category
      const categoryResult = await pool.query(`
        SELECT 
          category,
          COUNT(*) as count
        FROM courses
        WHERE status = 'published'
        GROUP BY category
        ORDER BY count DESC
      `);

      return {
        totalCourses: parseInt(countResult.rows[0].total),
        publishedCourses: parseInt(countResult.rows[0].published),
        mostAccessedCourses: coursesResult.rows.map((row) => ({
          courseId: row.course_id,
          courseTitle: row.course_title,
          instructorName: row.instructor_name,
          totalAccesses: parseInt(row.total_accesses),
          totalCompletions: parseInt(row.total_completions),
          completionRate: parseFloat(parseFloat(row.completion_rate).toFixed(2)),
          averageProgress: parseFloat(parseFloat(row.average_progress).toFixed(2)),
        })),
        coursesByCategory: categoryResult.rows.map((row) => ({
          category: row.category || 'Uncategorized',
          count: parseInt(row.count),
        })),
      };
    } catch (error) {
      logger.error('Failed to generate course report', error);
      throw error;
    }
  }

  /**
   * Generate financial report
   */
  async getFinancialReport(filters: ReportFilters = {}): Promise<FinancialReport> {
    try {
      const now = new Date();
      const startDate =
        filters.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = filters.endDate || now;

      // Get total revenue
      const totalRevenueResult = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total_revenue
        FROM payments
        WHERE status = 'paid'
      `);

      // Get revenue in period
      const periodRevenueResult = await pool.query(
        `
        SELECT COALESCE(SUM(amount), 0) as revenue_in_period
        FROM payments
        WHERE status = 'paid'
        AND paid_at >= $1 AND paid_at <= $2
      `,
        [startDate, endDate]
      );

      // Get MRR
      const mrr = await metricsService.getMonthlyRecurringRevenue();

      // Get average revenue per user
      const totalActive = await metricsService.getTotalActiveSubscribers();
      const averageRevenuePerUser = totalActive > 0 ? mrr / totalActive : 0;

      // Get revenue by plan
      const planRevenueResult = await pool.query(`
        SELECT 
          p.id as plan_id,
          p.name as plan_name,
          COUNT(s.id) as subscribers,
          SUM(p.price) as revenue
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.status = 'active'
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
      `);

      // Get revenue trend
      const revenueTrendResult = await pool.query(
        `
        SELECT 
          DATE(paid_at) as date,
          SUM(amount) as revenue
        FROM payments
        WHERE status = 'paid'
        AND paid_at >= $1 AND paid_at <= $2
        GROUP BY DATE(paid_at)
        ORDER BY date
      `,
        [startDate, endDate]
      );

      // Calculate projected MRR (simple projection based on current growth)
      const retentionRate = await metricsService.getRetentionRate(startDate, endDate);
      const projectedMRR = mrr * (retentionRate / 100);

      // Get consolidated gateway data
      const consolidatedMetrics = await gatewayIntegrationService.getConsolidatedFinancialMetrics(
        startDate,
        endDate
      );

      return {
        totalRevenue: parseFloat(totalRevenueResult.rows[0].total_revenue),
        revenueInPeriod: parseFloat(periodRevenueResult.rows[0].revenue_in_period),
        mrr,
        averageRevenuePerUser: parseFloat(averageRevenuePerUser.toFixed(2)),
        revenueByPlan: planRevenueResult.rows.map((row) => ({
          planId: row.plan_id,
          planName: row.plan_name,
          revenue: parseFloat(row.revenue),
          subscribers: parseInt(row.subscribers),
        })),
        revenueTrend: revenueTrendResult.rows.map((row) => ({
          date: row.date.toISOString().split('T')[0],
          revenue: parseFloat(row.revenue),
        })),
        projectedMRR: parseFloat(projectedMRR.toFixed(2)),
        gatewayData: {
          totalPaymentsFromGateway: consolidatedMetrics.gatewayData.totalPaymentsFromGateway,
          totalRevenueFromGateway: consolidatedMetrics.gatewayData.totalRevenueFromGateway,
          successfulPayments: consolidatedMetrics.gatewayData.successfulPayments,
          failedPayments: consolidatedMetrics.gatewayData.failedPayments,
          refundedPayments: consolidatedMetrics.gatewayData.refundedPayments,
          averageTransactionValue: consolidatedMetrics.gatewayData.averageTransactionValue,
          paymentSuccessRate: consolidatedMetrics.consolidated.paymentSuccessRate,
          refundRate: consolidatedMetrics.consolidated.refundRate,
        },
      };
    } catch (error) {
      logger.error('Failed to generate financial report', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
