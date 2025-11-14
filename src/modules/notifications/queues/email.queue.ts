import Queue from 'bull';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';
import { notificationService } from '../services/notification.service';
import type {
  WelcomeEmailData,
  InstructorCredentialsEmailData,
  CourseSubmittedEmailData,
  CourseApprovedEmailData,
  CourseRejectedEmailData,
  NewCoursePublishedEmailData,
  SubscriptionConfirmedEmailData,
  SubscriptionExpiringSoonEmailData,
  SubscriptionSuspendedEmailData,
  CertificateIssuedEmailData,
  PasswordResetEmailData,
} from '../services/notification.service';

/**
 * Email job types
 */
export enum EmailJobType {
  WELCOME = 'welcome',
  INSTRUCTOR_CREDENTIALS = 'instructor_credentials',
  COURSE_SUBMITTED = 'course_submitted',
  COURSE_APPROVED = 'course_approved',
  COURSE_REJECTED = 'course_rejected',
  NEW_COURSE_PUBLISHED = 'new_course_published',
  SUBSCRIPTION_CONFIRMED = 'subscription_confirmed',
  SUBSCRIPTION_EXPIRING_SOON = 'subscription_expiring_soon',
  SUBSCRIPTION_SUSPENDED = 'subscription_suspended',
  CERTIFICATE_ISSUED = 'certificate_issued',
  PASSWORD_RESET = 'password_reset',
}

/**
 * Email job data types
 */
export type EmailJobData =
  | { type: EmailJobType.WELCOME; data: WelcomeEmailData }
  | { type: EmailJobType.INSTRUCTOR_CREDENTIALS; data: InstructorCredentialsEmailData }
  | { type: EmailJobType.COURSE_SUBMITTED; data: CourseSubmittedEmailData }
  | { type: EmailJobType.COURSE_APPROVED; data: CourseApprovedEmailData }
  | { type: EmailJobType.COURSE_REJECTED; data: CourseRejectedEmailData }
  | { type: EmailJobType.NEW_COURSE_PUBLISHED; data: NewCoursePublishedEmailData }
  | { type: EmailJobType.SUBSCRIPTION_CONFIRMED; data: SubscriptionConfirmedEmailData }
  | { type: EmailJobType.SUBSCRIPTION_EXPIRING_SOON; data: SubscriptionExpiringSoonEmailData }
  | { type: EmailJobType.SUBSCRIPTION_SUSPENDED; data: SubscriptionSuspendedEmailData }
  | { type: EmailJobType.CERTIFICATE_ISSUED; data: CertificateIssuedEmailData }
  | { type: EmailJobType.PASSWORD_RESET; data: PasswordResetEmailData };

/**
 * Email queue for processing email notifications asynchronously
 */
class EmailQueue {
  private queue: Queue.Queue<EmailJobData>;

  constructor() {
    // Initialize Bull queue with Redis connection
    this.queue = new Queue<EmailJobData>('email-notifications', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
      },
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds delay
        },
        removeOnComplete: true, // Remove completed jobs
        removeOnFail: false, // Keep failed jobs for debugging
      },
    });

    // Set up job processor
    this.setupProcessor();

    // Set up event listeners
    this.setupEventListeners();

    logger.info('Email queue initialized');
  }

  /**
   * Set up the job processor
   */
  private setupProcessor(): void {
    this.queue.process(async (job: any) => {
      const { type, data } = job.data;

      logger.info('Processing email job', {
        jobId: job.id,
        type,
        attempt: job.attemptsMade + 1,
      });

      try {
        switch (type) {
          case EmailJobType.WELCOME:
            await notificationService.sendWelcomeEmail(data);
            break;

          case EmailJobType.INSTRUCTOR_CREDENTIALS:
            await notificationService.sendInstructorCredentialsEmail(data);
            break;

          case EmailJobType.COURSE_SUBMITTED:
            await notificationService.sendCourseSubmittedEmail(data);
            break;

          case EmailJobType.COURSE_APPROVED:
            await notificationService.sendCourseApprovedEmail(data);
            break;

          case EmailJobType.COURSE_REJECTED:
            await notificationService.sendCourseRejectedEmail(data);
            break;

          case EmailJobType.NEW_COURSE_PUBLISHED:
            await notificationService.sendNewCoursePublishedEmail(data);
            break;

          case EmailJobType.SUBSCRIPTION_CONFIRMED:
            await notificationService.sendSubscriptionConfirmedEmail(data);
            break;

          case EmailJobType.SUBSCRIPTION_EXPIRING_SOON:
            await notificationService.sendSubscriptionExpiringSoonEmail(data);
            break;

          case EmailJobType.SUBSCRIPTION_SUSPENDED:
            await notificationService.sendSubscriptionSuspendedEmail(data);
            break;

          case EmailJobType.CERTIFICATE_ISSUED:
            await notificationService.sendCertificateIssuedEmail(data);
            break;

          case EmailJobType.PASSWORD_RESET:
            await notificationService.sendPasswordResetEmail(data);
            break;

          default:
            throw new Error(`Unknown email job type: ${type}`);
        }

        logger.info('Email job completed successfully', {
          jobId: job.id,
          type,
        });
      } catch (error) {
        logger.error('Email job failed', {
          jobId: job.id,
          type,
          error,
          attempt: job.attemptsMade + 1,
        });
        throw error; // Re-throw to trigger retry
      }
    });
  }

  /**
   * Set up event listeners for queue monitoring
   */
  private setupEventListeners(): void {
    this.queue.on('completed', (job: any) => {
      logger.info('Email job completed', {
        jobId: job.id,
        type: job.data.type,
      });
    });

    this.queue.on('failed', (job: any, error: any) => {
      logger.error('Email job failed permanently', {
        jobId: job?.id,
        type: job?.data.type,
        error,
        attempts: job?.attemptsMade,
      });
    });

    this.queue.on('stalled', (job: any) => {
      logger.warn('Email job stalled', {
        jobId: job.id,
        type: job.data.type,
      });
    });

    this.queue.on('error', (error: any) => {
      logger.error('Email queue error', { error });
    });
  }

  /**
   * Add a job to the email queue
   */
  async addJob(jobData: EmailJobData, options?: Queue.JobOptions): Promise<Queue.Job<EmailJobData>> {
    try {
      const job = await this.queue.add(jobData, options);
      
      logger.info('Email job added to queue', {
        jobId: job.id,
        type: jobData.type,
      });

      return job;
    } catch (error) {
      logger.error('Failed to add email job to queue', {
        type: jobData.type,
        error,
      });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(): Promise<Queue.Job<EmailJobData>[]> {
    return this.queue.getFailed();
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);
    if (job) {
      await job.retry();
      logger.info('Email job retried', { jobId });
    }
  }

  /**
   * Clean old jobs from the queue
   */
  async cleanOldJobs(grace: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.queue.clean(grace, 'completed');
    await this.queue.clean(grace * 7, 'failed'); // Keep failed jobs for 7 days
    logger.info('Old email jobs cleaned', { grace });
  }

  /**
   * Close the queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
    logger.info('Email queue closed');
  }
}

// Export singleton instance
export const emailQueue = new EmailQueue();
