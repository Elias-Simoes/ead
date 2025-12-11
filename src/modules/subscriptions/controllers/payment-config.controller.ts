import { Request, Response } from 'express';
import { paymentConfigService, UpdatePaymentConfigData } from '../services/payment-config.service';
import { logger } from '@shared/utils/logger';
import { AuditService } from '@shared/services/audit.service';

/**
 * Payment Configuration Controller
 * Handles payment configuration endpoints
 */
export class PaymentConfigController {
  /**
   * GET /api/payments/config
   * Get current payment configuration
   * Public endpoint - no authentication required
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await paymentConfigService.getConfig();

      // Return only the relevant fields (exclude internal IDs and timestamps)
      res.json({
        maxInstallments: config.maxInstallments,
        pixDiscountPercent: config.pixDiscountPercent,
        installmentsWithoutInterest: config.installmentsWithoutInterest,
        pixExpirationMinutes: config.pixExpirationMinutes,
      });
    } catch (error) {
      logger.error('Error fetching payment config', error);
      
      if (error instanceof Error && error.message === 'CONFIG_NOT_FOUND') {
        res.status(404).json({
          error: 'CONFIG_NOT_FOUND',
          message: 'Payment configuration not found',
        });
        return;
      }

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch payment configuration',
      });
    }
  }

  /**
   * PUT /api/admin/payments/config
   * Update payment configuration
   * Admin only endpoint
   */
  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const updateData: UpdatePaymentConfigData = req.body;

      // Validate request body
      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Request body cannot be empty',
        });
        return;
      }

      // Get current config for audit log
      const currentConfig = await paymentConfigService.getConfig();

      // Update configuration
      const updatedConfig = await paymentConfigService.updateConfig(updateData);

      // Log audit entry
      await AuditService.log({
        userId,
        action: 'UPDATE_PAYMENT_CONFIG',
        resource: 'payment_config',
        resourceId: updatedConfig.id,
        details: {
          before: {
            maxInstallments: currentConfig.maxInstallments,
            pixDiscountPercent: currentConfig.pixDiscountPercent,
            installmentsWithoutInterest: currentConfig.installmentsWithoutInterest,
            pixExpirationMinutes: currentConfig.pixExpirationMinutes,
          },
          after: {
            maxInstallments: updatedConfig.maxInstallments,
            pixDiscountPercent: updatedConfig.pixDiscountPercent,
            installmentsWithoutInterest: updatedConfig.installmentsWithoutInterest,
            pixExpirationMinutes: updatedConfig.pixExpirationMinutes,
          },
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Return updated config
      res.json({
        maxInstallments: updatedConfig.maxInstallments,
        pixDiscountPercent: updatedConfig.pixDiscountPercent,
        installmentsWithoutInterest: updatedConfig.installmentsWithoutInterest,
        pixExpirationMinutes: updatedConfig.pixExpirationMinutes,
      });
    } catch (error) {
      logger.error('Error updating payment config', error);

      if (error instanceof Error) {
        // Handle validation errors
        if (error.message.startsWith('INVALID_')) {
          res.status(400).json({
            error: error.message,
            message: error.message.replace(/_/g, ' ').toLowerCase(),
          });
          return;
        }

        if (error.message === 'CONFIG_NOT_FOUND') {
          res.status(404).json({
            error: 'CONFIG_NOT_FOUND',
            message: 'Payment configuration not found',
          });
          return;
        }
      }

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update payment configuration',
      });
    }
  }
}

export const paymentConfigController = new PaymentConfigController();
