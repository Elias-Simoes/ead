import { emailService } from '../../../shared/services/email.service';
import { logger } from '../../../shared/utils/logger';
import { config } from '../../../config/env';

export interface Alert {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AlertRule {
  name: string;
  condition: () => Promise<boolean>;
  alert: Alert;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export class AlertService {
  private alertRules: Map<string, AlertRule> = new Map();
  private alertHistory: Alert[] = [];
  private maxHistorySize = 1000;

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.alertRules.set(rule.name, rule);
    logger.info(`Alert rule registered: ${rule.name}`);
  }

  /**
   * Send alert notification
   */
  async sendAlert(alert: Alert): Promise<void> {
    try {
      // Log alert
      logger.error(`ALERT: ${alert.title}`, {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metadata: alert.metadata,
      });

      // Add to history
      this.alertHistory.push(alert);
      if (this.alertHistory.length > this.maxHistorySize) {
        this.alertHistory.shift();
      }

      // Send email notification to admin
      await this.sendEmailAlert(alert);

      // TODO: Integrate with other alerting systems (Slack, PagerDuty, etc.)
    } catch (error) {
      logger.error('Failed to send alert', error);
    }
  }

  /**
   * Send email alert to admin
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || config.email.from;

      const severityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      };

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">
            ${severityEmoji[alert.severity]} ${alert.title}
          </h2>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Type:</strong> ${alert.type}</p>
            <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Message:</h3>
            <p>${alert.message}</p>
          </div>
          
          ${alert.metadata ? `
            <div style="margin: 20px 0;">
              <h3>Details:</h3>
              <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(alert.metadata, null, 2)}
              </pre>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This is an automated alert from Plataforma EAD monitoring system.</p>
          </div>
        </div>
      `;

      await emailService.sendEmail({
        to: adminEmail,
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html,
      });
    } catch (error) {
      logger.error('Failed to send email alert', error);
    }
  }

  /**
   * Check all registered alert rules
   */
  async checkAlertRules(): Promise<void> {
    for (const [name, rule] of this.alertRules) {
      try {
        // Check cooldown period
        if (rule.lastTriggered) {
          const cooldownMs = rule.cooldownMinutes * 60 * 1000;
          const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();

          if (timeSinceLastTrigger < cooldownMs) {
            continue; // Skip this rule, still in cooldown
          }
        }

        // Check condition
        const shouldAlert = await rule.condition();

        if (shouldAlert) {
          rule.alert.timestamp = new Date();
          await this.sendAlert(rule.alert);
          rule.lastTriggered = new Date();
        }
      } catch (error) {
        logger.error(`Failed to check alert rule: ${name}`, error);
      }
    }
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Clear alert history
   */
  clearAlertHistory(): void {
    this.alertHistory = [];
    logger.info('Alert history cleared');
  }

  /**
   * Alert for critical errors (500)
   */
  async alertCriticalError(error: Error, context?: Record<string, any>): Promise<void> {
    const alert: Alert = {
      type: 'error',
      title: 'Critical Error Detected',
      message: `A critical error occurred: ${error.message}`,
      severity: 'critical',
      metadata: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
      },
      timestamp: new Date(),
    };

    await this.sendAlert(alert);
  }

  /**
   * Alert for slow response times
   */
  async alertSlowResponse(path: string, duration: number, threshold: number = 5000): Promise<void> {
    if (duration > threshold) {
      const alert: Alert = {
        type: 'warning',
        title: 'Slow Response Time Detected',
        message: `Request to ${path} took ${duration}ms (threshold: ${threshold}ms)`,
        severity: 'high',
        metadata: {
          path,
          duration,
          threshold,
        },
        timestamp: new Date(),
      };

      await this.sendAlert(alert);
    }
  }

  /**
   * Alert for backup failures
   */
  async alertBackupFailure(error: Error): Promise<void> {
    const alert: Alert = {
      type: 'error',
      title: 'Backup Failed',
      message: `Database backup failed: ${error.message}`,
      severity: 'critical',
      metadata: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      },
      timestamp: new Date(),
    };

    await this.sendAlert(alert);
  }

  /**
   * Alert for high resource usage
   */
  async alertHighResourceUsage(resource: 'cpu' | 'memory' | 'disk', usage: number, threshold: number): Promise<void> {
    if (usage > threshold) {
      const alert: Alert = {
        type: 'warning',
        title: `High ${resource.toUpperCase()} Usage`,
        message: `${resource.toUpperCase()} usage is at ${usage}% (threshold: ${threshold}%)`,
        severity: usage > 90 ? 'critical' : 'high',
        metadata: {
          resource,
          usage,
          threshold,
        },
        timestamp: new Date(),
      };

      await this.sendAlert(alert);
    }
  }

  /**
   * Alert for service health issues
   */
  async alertServiceDown(service: string, error?: string): Promise<void> {
    const alert: Alert = {
      type: 'error',
      title: `Service Down: ${service}`,
      message: `The ${service} service is not responding`,
      severity: 'critical',
      metadata: {
        service,
        error,
      },
      timestamp: new Date(),
    };

    await this.sendAlert(alert);
  }
}

export const alertService = new AlertService();
