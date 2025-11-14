# Notifications Module - Setup Guide

## Quick Start

Follow these steps to set up the notifications module:

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `@sendgrid/mail` - SendGrid email provider
- `@aws-sdk/client-ses` - AWS SES email provider
- `mailgun.js` - Mailgun email provider
- `bull` - Queue management
- `form-data` - Required by Mailgun

### 2. Start Redis

The email queue requires Redis to be running:

```bash
# Using Docker Compose (recommended)
docker-compose up -d redis

# Or using Docker directly
docker run -d -p 6379:6379 redis:alpine

# Or if you have Redis installed locally
redis-server
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 3. Configure Environment Variables

Add the following to your `.env` file:

```env
# Email Configuration
EMAIL_PROVIDER=sendgrid  # Options: sendgrid, ses, mailgun
EMAIL_FROM=noreply@plataforma-ead.com
EMAIL_FROM_NAME=Plataforma EAD

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Choose ONE provider and configure its credentials:

# Option 1: SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Option 2: AWS SES
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here

# Option 3: Mailgun
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_mailgun_domain_here
```

### 4. Start the Application

```bash
npm run dev
```

The email queue will automatically start processing jobs.

### 5. Test the Notifications

Run the test script:

```bash
node test-notifications.js
```

Expected output:
```
🚀 Starting Notification Module Tests
======================================

📧 Test 1: Welcome Email on Registration
==========================================
✅ Student registered successfully
📬 Welcome email should be queued
   Email: student-1234567890@test.com

📧 Test 2: Instructor Credentials Email
==========================================
✅ Admin logged in
✅ Instructor created successfully
📬 Credentials email should be queued
   Email: instructor-1234567890@test.com
   Temporary Password: Abc123!@#

...

📊 Test Summary
===============
✅ Passed: 5
❌ Failed: 0
📈 Total: 5

🎉 All tests passed!
```

## Development Mode

If you don't configure an email provider, the system will run in development mode:

- Emails will be logged to the console instead of being sent
- The queue will still process jobs normally
- You can test the full notification flow without sending real emails

Example console output in development mode:
```
Email would be sent (development mode) {
  to: 'user@example.com',
  subject: 'Welcome to Plataforma EAD! 🎓',
  preview: '<!DOCTYPE html><html lang="pt-BR"><head>...'
}
```

## Email Provider Setup

### SendGrid

1. Sign up at https://sendgrid.com
2. Create an API key with "Mail Send" permissions
3. Add to `.env`:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

### AWS SES

1. Set up AWS SES in your AWS account
2. Verify your sender email address
3. Create IAM credentials with SES send permissions
4. Add to `.env`:
   ```env
   EMAIL_PROVIDER=ses
   AWS_SES_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
   AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Mailgun

1. Sign up at https://mailgun.com
2. Add and verify your domain
3. Get your API key from the dashboard
4. Add to `.env`:
   ```env
   EMAIL_PROVIDER=mailgun
   MAILGUN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   MAILGUN_DOMAIN=mg.yourdomain.com
   ```

## Monitoring

### Check Queue Status

In your application code:

```typescript
import { emailQueueService } from '@modules/notifications/services/email-queue.service';

const stats = await emailQueueService.getQueueStats();
console.log(stats);
// { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0 }
```

### View Server Logs

The queue logs all activities:

```
Email queue initialized
Email job added to queue { jobId: '1', type: 'welcome' }
Processing email job { jobId: '1', type: 'welcome', attempt: 1 }
Email sent successfully { to: 'user@example.com', subject: '...', provider: 'sendgrid' }
Email job completed { jobId: '1', type: 'welcome' }
```

### Handle Failed Jobs

```typescript
// Get failed jobs
const failedJobs = await emailQueueService.getFailedJobs();

// Retry a specific job
await emailQueueService.retryFailedJob('job-id');
```

## Troubleshooting

### Redis Connection Error

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**: Make sure Redis is running:
```bash
docker-compose up -d redis
# or
redis-server
```

### Email Provider Error

**Error**: `Failed to send email`

**Solutions**:
1. Check your API credentials in `.env`
2. Verify your sender email is verified (for SES)
3. Check your email provider dashboard for errors
4. Review server logs for detailed error messages

### Emails Not Being Sent

**Checklist**:
- [ ] Redis is running
- [ ] Email provider is configured in `.env`
- [ ] API credentials are correct
- [ ] Sender email is verified (if required)
- [ ] Check server logs for errors
- [ ] Verify queue stats show jobs being processed

### Queue Not Processing

**Solutions**:
1. Restart the application
2. Check Redis connection
3. Review server logs for queue errors
4. Verify Bull dependencies are installed

## Production Deployment

### Before Going Live

1. **Configure Production Email Provider**
   - Use a production-grade email service
   - Verify sender domain/email
   - Set up SPF, DKIM, and DMARC records

2. **Set Environment Variables**
   ```env
   NODE_ENV=production
   EMAIL_PROVIDER=sendgrid  # or ses/mailgun
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Your Platform Name
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Monitor Email Delivery**
   - Set up alerts for failed jobs
   - Monitor queue statistics
   - Track email deliverability rates

4. **Scale if Needed**
   - Bull queues can run multiple workers
   - Consider dedicated Redis instance
   - Monitor Redis memory usage

### Production Checklist

- [ ] Email provider configured and tested
- [ ] Sender domain verified
- [ ] SPF/DKIM/DMARC records set up
- [ ] Production credentials in environment
- [ ] Redis running and monitored
- [ ] Alerts set up for failed jobs
- [ ] Email templates reviewed and approved
- [ ] Test all email types in staging
- [ ] Monitor email deliverability

## Next Steps

Once the notifications module is set up:

1. Test all email types manually
2. Monitor queue performance
3. Review email templates and customize if needed
4. Set up email analytics (optional)
5. Configure email preferences for users (future enhancement)

## Support

For issues or questions:
- Check the module README: `src/modules/notifications/README.md`
- Review the implementation summary: `TASK_11_NOTIFICATIONS_SUMMARY.md`
- Check server logs for detailed error messages
- Verify all dependencies are installed: `npm install`

## Summary

The notifications module is now ready to use! It will automatically send emails for:

- ✅ Student registration (welcome email)
- ✅ Instructor creation (credentials email)
- ✅ Password reset requests
- ✅ Course submissions
- ✅ Course approvals/rejections
- ✅ Subscription confirmations
- ✅ Certificate issuance
- ✅ New course announcements

All emails are processed asynchronously through a reliable queue system with automatic retry logic.
