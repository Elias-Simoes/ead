import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { exportService, ExportFormat, ReportType } from '../services/export.service';
import { logger } from '@shared/utils/logger';

export class ReportController {
  /**
   * GET /api/admin/reports/overview
   * Get overview report with key metrics
   */
  async getOverviewReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const report = await reportService.getOverviewReport(filters);

      res.json(report);
    } catch (error) {
      logger.error('Error getting overview report', error);
      res.status(500).json({
        error: {
          code: 'OVERVIEW_REPORT_FAILED',
          message: 'Failed to generate overview report',
        },
      });
    }
  }

  /**
   * GET /api/admin/reports/subscriptions
   * Get detailed subscription report
   */
  async getSubscriptionReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const report = await reportService.getSubscriptionReport(filters);

      res.json(report);
    } catch (error) {
      logger.error('Error getting subscription report', error);
      res.status(500).json({
        error: {
          code: 'SUBSCRIPTION_REPORT_FAILED',
          message: 'Failed to generate subscription report',
        },
      });
    }
  }

  /**
   * GET /api/admin/reports/courses
   * Get detailed course report
   */
  async getCourseReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const report = await reportService.getCourseReport(filters);

      res.json(report);
    } catch (error) {
      logger.error('Error getting course report', error);
      res.status(500).json({
        error: {
          code: 'COURSE_REPORT_FAILED',
          message: 'Failed to generate course report',
        },
      });
    }
  }

  /**
   * GET /api/admin/reports/financial
   * Get financial report
   */
  async getFinancialReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const report = await reportService.getFinancialReport(filters);

      res.json(report);
    } catch (error) {
      logger.error('Error getting financial report', error);
      res.status(500).json({
        error: {
          code: 'FINANCIAL_REPORT_FAILED',
          message: 'Failed to generate financial report',
        },
      });
    }
  }

  /**
   * GET /api/admin/reports/export
   * Export report in specified format
   */
  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const { format, type, startDate, endDate } = req.query;

      // Validate required parameters
      if (!format || !type) {
        res.status(400).json({
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Format and type parameters are required',
          },
        });
        return;
      }

      // Validate format
      if (format !== 'csv' && format !== 'pdf') {
        res.status(400).json({
          error: {
            code: 'INVALID_FORMAT',
            message: 'Format must be either csv or pdf',
          },
        });
        return;
      }

      // Validate type
      const validTypes = ['overview', 'subscriptions', 'courses', 'financial'];
      if (!validTypes.includes(type as string)) {
        res.status(400).json({
          error: {
            code: 'INVALID_TYPE',
            message: 'Type must be one of: overview, subscriptions, courses, financial',
          },
        });
        return;
      }

      const filters = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const result = await exportService.exportReport(
        type as ReportType,
        format as ExportFormat,
        filters
      );

      // Set response headers for file download
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } catch (error) {
      logger.error('Error exporting report', error);
      res.status(500).json({
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to export report',
        },
      });
    }
  }
}

export const reportController = new ReportController();
