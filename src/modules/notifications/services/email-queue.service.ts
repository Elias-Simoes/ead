import { emailQueue, EmailJobType } from '../queues/email.queue';
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
} from './notification.service';

/**
 * Email queue service for enqueuing email notifications
 */
export class EmailQueueService {
  /**
   * Enqueue welcome email
   */
  async enqueueWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.WELCOME,
      data,
    });
  }

  /**
   * Enqueue instructor credentials email
   */
  async enqueueInstructorCredentialsEmail(data: InstructorCredentialsEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.INSTRUCTOR_CREDENTIALS,
      data,
    });
  }

  /**
   * Enqueue course submitted email
   */
  async enqueueCourseSubmittedEmail(data: CourseSubmittedEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.COURSE_SUBMITTED,
      data,
    });
  }

  /**
   * Enqueue course approved email
   */
  async enqueueCourseApprovedEmail(data: CourseApprovedEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.COURSE_APPROVED,
      data,
    });
  }

  /**
   * Enqueue course rejected email
   */
  async enqueueCourseRejectedEmail(data: CourseRejectedEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.COURSE_REJECTED,
      data,
    });
  }

  /**
   * Enqueue new course published email
   */
  async enqueueNewCoursePublishedEmail(data: NewCoursePublishedEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.NEW_COURSE_PUBLISHED,
      data,
    });
  }

  /**
   * Enqueue subscription confirmed email
   */
  async enqueueSubscriptionConfirmedEmail(data: SubscriptionConfirmedEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.SUBSCRIPTION_CONFIRMED,
      data,
    });
  }

  /**
   * Enqueue subscription expiring soon email
   */
  async enqueueSubscriptionExpiringSoonEmail(data: SubscriptionExpiringSoonEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.SUBSCRIPTION_EXPIRING_SOON,
      data,
    });
  }

  /**
   * Enqueue subscription suspended email
   */
  async enqueueSubscriptionSuspendedEmail(data: SubscriptionSuspendedEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.SUBSCRIPTION_SUSPENDED,
      data,
    });
  }

  /**
   * Enqueue certificate issued email
   */
  async enqueueCertificateIssuedEmail(data: CertificateIssuedEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.CERTIFICATE_ISSUED,
      data,
    });
  }

  /**
   * Enqueue password reset email
   */
  async enqueuePasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    await emailQueue.addJob({
      type: EmailJobType.PASSWORD_RESET,
      data,
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return emailQueue.getStats();
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs() {
    return emailQueue.getFailedJobs();
  }

  /**
   * Retry a failed job
   */
  async retryFailedJob(jobId: string): Promise<void> {
    await emailQueue.retryJob(jobId);
  }
}

export const emailQueueService = new EmailQueueService();
