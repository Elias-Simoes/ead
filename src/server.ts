import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { requestLoggerMiddleware } from './shared/middleware/request-logger.middleware';
import { testConnection } from './config/database';
import { connectRedis } from './config/redis';
import authRoutes from './modules/auth/routes/auth.routes';
import instructorRoutes from './modules/users/routes/instructor.routes';
import instructorTrackingRoutes from './modules/instructors/routes/instructor-tracking.routes';
import studentRoutes from './modules/users/routes/student.routes';
import courseRoutes from './modules/courses/routes/course.routes';
import subscriptionRoutes from './modules/subscriptions/routes/subscription.routes';
import adminSubscriptionRoutes from './modules/subscriptions/routes/admin-subscription.routes';
import webhookRoutes from './modules/subscriptions/routes/webhook.routes';
import progressRoutes from './modules/progress/routes/progress.routes';
import assessmentRoutes from './modules/assessments/routes/assessment.routes';
import certificateRoutes from './modules/certificates/routes/certificate.routes';
import reportRoutes from './modules/reports/routes/report.routes';
import gdprRoutes from './modules/gdpr/routes/gdpr.routes';
import healthRoutes from './modules/health/routes/health.routes';
import uploadRoutes from './shared/routes/upload.routes';
// import backupRoutes from './modules/backup/routes/backup.routes'; // Temporarily disabled
// import monitoringRoutes from './modules/monitoring/routes/monitoring.routes'; // Temporarily disabled
import { updateLastAccess } from './shared/middleware/lastAccess.middleware';
import { securityHeaders } from './shared/middleware/security-headers.middleware';
import { getCsrfToken } from './shared/middleware/csrf.middleware';
import { authenticate } from './shared/middleware/auth.middleware';
import { globalRateLimit } from './shared/middleware/rateLimit.middleware';
import { startExpiredSubscriptionsJob } from './modules/subscriptions/jobs/check-expired-subscriptions.job';
import { startCertificateIssuanceJob } from './modules/certificates/jobs/issue-certificates.job';
import { startGdprDeletionJob } from './modules/gdpr/jobs/process-gdpr-deletions.job';
import { monitoringJob } from './modules/monitoring/jobs/monitoring.job';
import { backupJob } from './modules/backup/jobs/backup.job';
// import { backupJob } from './modules/backup/jobs/backup.job'; // Temporarily disabled
// import { monitoringJob } from './modules/monitoring/jobs/monitoring.job'; // Temporarily disabled

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Compression middleware - compress responses > 1KB
app.use(
  compression({
    filter: (req, res) => {
      // Don't compress if client doesn't support it
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression filter
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses larger than 1KB
    level: 6, // Compression level (0-9, 6 is default balance)
  })
);

// Webhook routes need raw body - must be before JSON parser
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware with context
app.use(requestLoggerMiddleware);

// Global rate limiting (100 req/min per IP)
app.use('/api', globalRateLimit);

// Update last access timestamp for authenticated users
app.use(updateLastAccess);

// Health check routes (no authentication required)
app.use('/health', healthRoutes);

// CSRF token endpoint
app.get('/api/csrf-token', authenticate, getCsrfToken);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/instructors', instructorRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionRoutes);
app.use('/api/admin/reports', reportRoutes);
// app.use('/api/admin/backup', backupRoutes); // Temporarily disabled
// app.use('/api/admin/monitoring', monitoringRoutes); // Temporarily disabled
app.use('/api/instructor', instructorTrackingRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', progressRoutes);
app.use('/api', assessmentRoutes);
app.use('/api', certificateRoutes);
app.use('/api/gdpr', gdprRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize connections and start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Connect to Redis
    await connectRedis();

    // Start cron jobs
    startExpiredSubscriptionsJob();
    startCertificateIssuanceJob();
    startGdprDeletionJob();
    backupJob.start();
    monitoringJob.start();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API URL: ${config.apiUrl}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

export default app;
