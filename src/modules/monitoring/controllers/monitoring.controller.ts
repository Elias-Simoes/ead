import { Request, Response } from 'express';
import { metricsService } from '../services/metrics.service';
import { alertService } from '../services/alert.service';
import { logger } from '../../../shared/utils/logger';

export class MonitoringController {
  /**
   * Get current system metrics
   * GET /api/admin/monitoring/metrics
   */
  async getMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const metrics = await metricsService.collectMetrics();

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).json({
        error: {
          code: 'METRICS_FAILED',
          message: 'Failed to collect metrics',
        },
      });
    }
  }

  /**
   * Get metrics history
   * GET /api/admin/monitoring/metrics/history
   */
  async getMetricsHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = metricsService.getMetricsHistory(limit);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Failed to get metrics history', error);
      res.status(500).json({
        error: {
          code: 'METRICS_HISTORY_FAILED',
          message: 'Failed to get metrics history',
        },
      });
    }
  }

  /**
   * Get average metrics
   * GET /api/admin/monitoring/metrics/average
   */
  async getAverageMetrics(req: Request, res: Response): Promise<void> {
    try {
      const minutes = parseInt(req.query.minutes as string) || 5;
      const average = metricsService.getAverageMetrics(minutes);

      res.status(200).json({
        success: true,
        data: average,
      });
    } catch (error) {
      logger.error('Failed to get average metrics', error);
      res.status(500).json({
        error: {
          code: 'AVERAGE_METRICS_FAILED',
          message: 'Failed to get average metrics',
        },
      });
    }
  }

  /**
   * Get alert history
   * GET /api/admin/monitoring/alerts
   */
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const alerts = alertService.getAlertHistory(limit);

      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      logger.error('Failed to get alerts', error);
      res.status(500).json({
        error: {
          code: 'ALERTS_FAILED',
          message: 'Failed to get alerts',
        },
      });
    }
  }

  /**
   * Test alert system
   * POST /api/admin/monitoring/alerts/test
   */
  async testAlert(req: Request, res: Response): Promise<void> {
    try {
      await alertService.sendAlert({
        type: 'info',
        title: 'Test Alert',
        message: 'This is a test alert from the monitoring system',
        severity: 'low',
        metadata: {
          triggeredBy: (req.user as any)?.id,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
      });

      res.status(200).json({
        success: true,
        message: 'Test alert sent successfully',
      });
    } catch (error) {
      logger.error('Failed to send test alert', error);
      res.status(500).json({
        error: {
          code: 'TEST_ALERT_FAILED',
          message: 'Failed to send test alert',
        },
      });
    }
  }
}

export const monitoringController = new MonitoringController();
