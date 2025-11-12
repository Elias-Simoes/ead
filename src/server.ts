import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { testConnection } from './config/database';
import { connectRedis } from './config/redis';
import authRoutes from './modules/auth/routes/auth.routes';
import instructorRoutes from './modules/users/routes/instructor.routes';
import studentRoutes from './modules/users/routes/student.routes';
import courseRoutes from './modules/courses/routes/course.routes';
import subscriptionRoutes from './modules/subscriptions/routes/subscription.routes';
import adminSubscriptionRoutes from './modules/subscriptions/routes/admin-subscription.routes';
import webhookRoutes from './modules/subscriptions/routes/webhook.routes';
import progressRoutes from './modules/progress/routes/progress.routes';
import assessmentRoutes from './modules/assessments/routes/assessment.routes';
import { updateLastAccess } from './shared/middleware/lastAccess.middleware';
import { startExpiredSubscriptionsJob } from './modules/subscriptions/jobs/check-expired-subscriptions.job';

// Load environment variables
dotenv.config();

const app = express();
const PORT = config.port;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Webhook routes need raw body - must be before JSON parser
app.use('/api/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Update last access timestamp for authenticated users
app.use(updateLastAccess);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/instructors', instructorRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', progressRoutes);
app.use('/api', assessmentRoutes);

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
