# Notifications Module

This module handles all email notifications in the Plataforma EAD system using a queue-based approach with Bull and Redis.

## Features

- **Email Queue Processing**: Asynchronous email sending with retry logic
- **Multiple Email Providers**: Support for SendGrid, AWS SES, and Mailgun
- **Professional Templates**: Pre-designed HTML email templates
- **Automatic Retry**: Failed emails are automatically retried up to 3 times
- **Job Monitoring**: Track email queue statistics and failed jobs

## Architecture

```
notifications/
├── services/
│   ├── notification.service.ts    # High-level notification methods
│   └── email-queue.service.ts     # Queue management service
├── queues/
│   └── email.queue.ts             # Bull queue configuration
└── templates/
    └── email-templates.ts         # HTML email templates
```

## Email Types

The module supports the following email notifications:

1. **Welcome Email** - Sent when a student registers
2. **Instructor Credentials** - Sent when an instructor is created
3. **Course Submitted** - Sent when an instructor submits a course for approval
4. **Course Approved** - Sent when an admin approves a course
5. **Course Rejected** - Sent when an admin rejects a course
6. **New Course Published** - Sent to all active students when a new course is published
7. **Subscription Confirmed** - Sent when a subscription payment is confirmed
8. **Subscription Expiring Soon** - Sent 3 days before subscription expires
9. **Subscription Suspended** - Sent when a subscription is suspended
10. **Certificate Issued** - Sent when a certificate is automatically issued
11. **Password Reset** - Sent when a user requests password reset

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Email Provider (sendgrid, ses, or mailgun)
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@plataforma-ead.com
EMAIL_FROM_NAME=Plataforma EAD

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# AWS SES
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### Install Dependencies

```bash
npm install @sendgrid/mail @aws-sdk/client-ses mailgun.js bull form-data
npm install --save-dev @types/bull
```

## Usage

### Sending Emails

Use the `emailQueueService` to enqueue emails:

```typescript
import { emailQueueService } from '@modules/notifications/services/email-queue.service';

// Send welcome email
await emailQueueService.enqueueWelcomeEmail({
  name: 'John Doe',
  email: 'john@example.com',
});

// Send instructor credentials
await emailQueueService.enqueueInstructorCredentialsEmail({
  name: 'Jane Smith',
  email: 'jane@example.com',
  temporaryPassword: 'Temp@1234',
});

// Send course approved email
await emailQueueService.enqueueCourseApprovedEmail({
  instructorName: 'Jane Smith',
  instructorEmail: 'jane@example.com',
  courseTitle: 'Introduction to TypeScript',
  courseId: 'course-uuid',
});
```

### Queue Management

```typescript
import { emailQueueService } from '@modules/notifications/services/email-queue.service';

// Get queue statistics
const stats = await emailQueueService.getQueueStats();
console.log(stats);
// { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0 }

// Get failed jobs
const failedJobs = await emailQueueService.getFailedJobs();

// Retry a failed job
await emailQueueService.retryFailedJob('job-id');
```

## Email Templates

All email templates are located in `templates/email-templates.ts`. They use a consistent design with:

- Responsive layout
- Professional styling
- Clear call-to-action buttons
- Footer with unsubscribe information

### Customizing Templates

To customize a template, edit the corresponding function in `email-templates.ts`:

```typescript
export const getWelcomeTemplate = (data: { name: string; loginUrl: string }): string => {
  const content = `
    <div class="header">
      <h1>Welcome to Platform!</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${data.name}</strong>,</p>
      <!-- Your custom content -->
    </div>
  `;
  
  return getBaseTemplate(content);
};
```

## Queue Configuration

The email queue is configured with the following settings:

- **Retry Attempts**: 3
- **Backoff Strategy**: Exponential (starts at 2 seconds)
- **Remove on Complete**: Yes (to save memory)
- **Remove on Fail**: No (for debugging)

### Monitoring

The queue emits events that are logged:

- `completed` - Job completed successfully
- `failed` - Job failed permanently (after all retries)
- `stalled` - Job is taking too long
- `error` - Queue error

Check your application logs to monitor email processing.

## Development Mode

In development mode (when no email provider is configured), emails are logged to the console instead of being sent. This allows you to test the notification flow without actually sending emails.

## Testing

Run the notification tests:

```bash
node test-notifications.js
```

This will test:
- Welcome email on registration
- Instructor credentials email
- Password reset email
- Course submission email
- Queue statistics

## Integration Points

The notification module is integrated into the following services:

1. **Auth Service** (`src/modules/auth/services/auth.service.ts`)
   - Welcome email on registration
   - Password reset email

2. **Instructor Service** (`src/modules/users/services/instructor.service.ts`)
   - Instructor credentials email

3. **Course Service** (`src/modules/courses/services/course.service.ts`)
   - Course submitted email
   - Course approved email
   - Course rejected email

4. **Subscription Webhook Handler** (`src/modules/subscriptions/services/webhook-handler.service.ts`)
   - Subscription confirmed email

5. **Certificate Job** (`src/modules/certificates/jobs/issue-certificates.job.ts`)
   - Certificate issued email

6. **New Courses Job** (`src/modules/progress/jobs/notify-new-courses.job.ts`)
   - New course published email

## Troubleshooting

### Emails not being sent

1. Check Redis is running: `redis-cli ping`
2. Check email provider credentials in `.env`
3. Check server logs for queue errors
4. Verify queue statistics: `await emailQueueService.getQueueStats()`

### Failed jobs

1. Get failed jobs: `await emailQueueService.getFailedJobs()`
2. Check job error details in logs
3. Retry failed job: `await emailQueueService.retryFailedJob(jobId)`

### Queue not processing

1. Ensure Redis connection is working
2. Check for queue errors in logs
3. Restart the application

## Production Considerations

1. **Email Provider**: Configure a production email provider (SendGrid, SES, or Mailgun)
2. **Rate Limiting**: Be aware of your email provider's rate limits
3. **Monitoring**: Set up alerts for failed jobs
4. **Queue Cleanup**: Old jobs are automatically cleaned up (completed: 24h, failed: 7 days)
5. **Scaling**: Bull queues can be scaled horizontally by running multiple workers

## Future Enhancements

- [ ] Email preferences (allow users to opt-out of certain notifications)
- [ ] Email templates in multiple languages
- [ ] SMS notifications
- [ ] Push notifications
- [ ] In-app notifications
- [ ] Email analytics (open rates, click rates)
