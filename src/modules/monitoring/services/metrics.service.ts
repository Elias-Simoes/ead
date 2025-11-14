import os from 'os';
import { logger } from '../../../shared/utils/logger';
import { alertService } from './alert.service';

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk?: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  uptime: number;
  timestamp: Date;
}

export class MetricsService {
  private metricsHistory: SystemMetrics[] = [];
  private maxHistorySize = 1000;

  /**
   * Collect current system metrics
   */
  async collectMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      cpu: this.getCPUMetrics(),
      memory: this.getMemoryMetrics(),
      uptime: process.uptime(),
      timestamp: new Date(),
    };

    // Add to history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    // Check for alerts
    await this.checkMetricsAlerts(metrics);

    return metrics;
  }

  /**
   * Get CPU metrics
   */
  private getCPUMetrics(): SystemMetrics['cpu'] {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - Math.floor((idle / total) * 100);

    return {
      usage,
      loadAverage,
    };
  }

  /**
   * Get memory metrics
   */
  private getMemoryMetrics(): SystemMetrics['memory'] {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const percentage = Math.round((usedMemory / totalMemory) * 100);

    return {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024), // MB
      free: Math.round(freeMemory / 1024 / 1024), // MB
      percentage,
    };
  }

  /**
   * Check metrics against alert thresholds
   */
  private async checkMetricsAlerts(metrics: SystemMetrics): Promise<void> {
    // CPU alert (threshold: 80%)
    if (metrics.cpu.usage > 80) {
      await alertService.alertHighResourceUsage('cpu', metrics.cpu.usage, 80);
    }

    // Memory alert (threshold: 85%)
    if (metrics.memory.percentage > 85) {
      await alertService.alertHighResourceUsage('memory', metrics.memory.percentage, 85);
    }

    // Disk alert (threshold: 90%)
    if (metrics.disk && metrics.disk.percentage > 90) {
      await alertService.alertHighResourceUsage('disk', metrics.disk.percentage, 90);
    }
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 100): SystemMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get average metrics over a time period
   */
  getAverageMetrics(minutes: number = 5): Partial<SystemMetrics> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    const recentMetrics = this.metricsHistory.filter(
      (m) => m.timestamp >= cutoffTime
    );

    if (recentMetrics.length === 0) {
      return {};
    }

    const avgCPU =
      recentMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentMetrics.length;
    const avgMemory =
      recentMetrics.reduce((sum, m) => sum + m.memory.percentage, 0) /
      recentMetrics.length;

    return {
      cpu: {
        usage: Math.round(avgCPU),
        loadAverage: [],
      },
      memory: {
        total: recentMetrics[0].memory.total,
        used: 0,
        free: 0,
        percentage: Math.round(avgMemory),
      },
    };
  }

  /**
   * Clear metrics history
   */
  clearMetricsHistory(): void {
    this.metricsHistory = [];
    logger.info('Metrics history cleared');
  }
}

export const metricsService = new MetricsService();
