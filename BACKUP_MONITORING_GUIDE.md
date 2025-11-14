# Backup and Monitoring Module Guide

## Overview

This guide covers the backup and monitoring features implemented in the Plataforma EAD system, including automated database backups, health checks, system metrics, and alerting.

## Table of Contents

1. [Backup System](#backup-system)
2. [Health Checks](#health-checks)
3. [Monitoring & Metrics](#monitoring--metrics)
4. [Alerting System](#alerting-system)
5. [Structured Logging](#structured-logging)
6. [Configuration](#configuration)

---

## Backup System

### Features

- **Automated Daily Backups**: Scheduled backups run at 3:00 AM daily (configurable)
- **Cloud Storage**: Backups are uploaded to S3/Cloudflare R2
- **Retention Policy**: Automatically deletes backups older than 30 days (configurable)
- **Manual Backups**: Admin can trigger backups on-demand
- **Restore Functionality**: Restore database from any backup
- **Validation**: Backup integrity validation before restore

### API Endpoints

#### List All Backups
```http
GET /api/admin/backup/list
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "filename": "backup-2025-11-12T03-00-00-000Z.sql",
      "lastModified": "2025-11-12T03:05:00.000Z",
      "size": 52428800,
      "sizeInMB": "50.00"
    }
  ]
}
```

#### Create Manual Backup
```http
POST /api/admin/backup/create
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "message": "Backup created successfully"
}
```

#### Restore from Backup
```http
POST /api/admin/backup/restore
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "filename": "backup-2025-11-12T03-00-00-000Z.sql"
}
```

Response:
```json
{
  "success": true,
  "message": "Database restored successfully"
}
```

#### Download Backup
```http
GET /api/admin/backup/download/:filename
Authorization: Bearer <admin_token>
```

Returns the backup file for download.

#### Delete Backup
```http
DELETE /api/admin/backup/:filename
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

### Configuration

Environment variables:
```env
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 3 * * *  # Cron format: daily at 3:00 AM
BACKUP_RETENTION_DAYS=30
```

---

## Health Checks

### Features

- **Basic Health Check**: Application status and uptime
- **Database Health**: PostgreSQL connection status
- **Redis Health**: Redis connection status
- **Comprehensive Check**: All services status
- **Kubernetes Probes**: Readiness and liveness probes

### API Endpoints

#### Basic Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "memory": {
      "used": 150,
      "total": 512,
      "percentage": 29
    }
  }
}
```

#### Database Health Check
```http
GET /health/db
```

Response:
```json
{
  "service": "database",
  "status": "up",
  "responseTime": 15
}
```

#### Redis Health Check
```http
GET /health/redis
```

Response:
```json
{
  "service": "redis",
  "status": "up",
  "responseTime": 5
}
```

#### Comprehensive Health Check
```http
GET /health/all
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 15
    },
    "redis": {
      "status": "up",
      "responseTime": 5
    },
    "memory": {
      "used": 150,
      "total": 512,
      "percentage": 29
    }
  }
}
```

#### Readiness Probe (Kubernetes)
```http
GET /health/ready
```

Returns 200 if application is ready to accept traffic, 503 otherwise.

#### Liveness Probe (Kubernetes)
```http
GET /health/live
```

Returns 200 if application is alive, 503 otherwise.

---

## Monitoring & Metrics

### Features

- **System Metrics**: CPU, memory, disk usage
- **Metrics History**: Historical data for trend analysis
- **Average Metrics**: Calculate averages over time periods
- **Automatic Collection**: Metrics collected every minute
- **Alert Integration**: Automatic alerts for high resource usage

### API Endpoints

#### Get Current Metrics
```http
GET /api/admin/monitoring/metrics
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "cpu": {
      "usage": 45,
      "loadAverage": [1.5, 1.3, 1.2]
    },
    "memory": {
      "total": 8192,
      "used": 4096,
      "free": 4096,
      "percentage": 50
    },
    "uptime": 86400,
    "timestamp": "2025-11-12T10:30:00.000Z"
  }
}
```

#### Get Metrics History
```http
GET /api/admin/monitoring/metrics/history?limit=100
Authorization: Bearer <admin_token>
```

Returns array of historical metrics.

#### Get Average Metrics
```http
GET /api/admin/monitoring/metrics/average?minutes=5
Authorization: Bearer <admin_token>
```

Returns average metrics over the specified time period.

### Monitoring Jobs

- **Metrics Collection**: Runs every 1 minute
- **Health Checks**: Runs every 5 minutes
- **Alert Checks**: Integrated with metrics collection

---

## Alerting System

### Features

- **Multiple Alert Types**: Error, warning, info
- **Severity Levels**: Critical, high, medium, low
- **Email Notifications**: Automatic email alerts to admin
- **Alert History**: Track all alerts
- **Cooldown Period**: Prevent alert spam
- **Automatic Triggers**: Alerts for critical events

### Alert Types

1. **Critical Errors (500)**: Automatic alert on server errors
2. **Slow Response Times**: Alert when response time > 5 seconds
3. **Backup Failures**: Alert when backup fails
4. **High Resource Usage**: Alert when CPU/memory/disk > threshold
5. **Service Down**: Alert when database or Redis is down

### API Endpoints

#### Get Alert History
```http
GET /api/admin/monitoring/alerts?limit=100
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "type": "error",
      "title": "Critical Error Detected",
      "message": "A critical error occurred: Database connection failed",
      "severity": "critical",
      "metadata": {
        "error": {
          "name": "ConnectionError",
          "message": "Database connection failed",
          "stack": "..."
        }
      },
      "timestamp": "2025-11-12T10:30:00.000Z"
    }
  ]
}
```

#### Test Alert System
```http
POST /api/admin/monitoring/alerts/test
Authorization: Bearer <admin_token>
```

Sends a test alert to verify the alerting system is working.

### Alert Thresholds

- **CPU Usage**: Alert at 80%
- **Memory Usage**: Alert at 85%
- **Disk Usage**: Alert at 90%
- **Response Time**: Alert at 5 seconds
- **Service Down**: Immediate alert

### Email Alert Format

Alerts are sent via email with:
- Severity emoji indicator (🔴 🟠 🟡 🟢)
- Alert title and type
- Timestamp
- Detailed message
- Metadata (if available)

---

## Structured Logging

### Features

- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Structured Format**: JSON format for easy parsing
- **Context Enrichment**: userId, requestId, IP, method, path
- **Log Rotation**: Daily rotation with 30-day retention
- **Separate Error Logs**: Dedicated error log file
- **Request Logging**: Automatic logging of all HTTP requests

### Log Levels

```typescript
logger.error('Error message', error, { userId: '123' });
logger.warn('Warning message', { context: 'data' });
logger.info('Info message', { action: 'completed' });
logger.debug('Debug message', { details: 'verbose' });
```

### Log Files

- `logs/error-YYYY-MM-DD.log`: Error logs only
- `logs/combined-YYYY-MM-DD.log`: All logs
- Logs are rotated daily
- Maximum file size: 20MB
- Retention: 30 days
- Compressed archives for old logs

### Request Context

Every request is automatically logged with:
- Request ID (UUID)
- HTTP method and path
- User ID (if authenticated)
- IP address
- User agent
- Response status code
- Response time

### Slow Request Detection

Requests taking longer than 5 seconds are automatically logged as warnings.

---

## Configuration

### Environment Variables

```env
# Logging
LOG_LEVEL=info  # error, warn, info, debug

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 3 * * *  # Cron format
BACKUP_RETENTION_DAYS=30

# Monitoring & Alerts
ADMIN_EMAIL=admin@plataforma-ead.com

# Database (required for backups)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=plataforma_ead
DB_USER=user
DB_PASSWORD=password

# Storage (required for backup uploads)
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
```

### Cron Schedule Format

The backup schedule uses standard cron format:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

Examples:
- `0 3 * * *` - Daily at 3:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight

---

## Best Practices

### Backups

1. **Test Restores**: Regularly test backup restoration
2. **Monitor Backup Size**: Watch for unexpected size changes
3. **Verify Alerts**: Ensure backup failure alerts are working
4. **Off-site Storage**: Use cloud storage for disaster recovery
5. **Document Procedures**: Keep restore procedures documented

### Monitoring

1. **Set Appropriate Thresholds**: Adjust based on your infrastructure
2. **Review Metrics Regularly**: Check trends and patterns
3. **Act on Alerts**: Don't ignore alerts, investigate and resolve
4. **Monitor Trends**: Look for gradual degradation
5. **Capacity Planning**: Use metrics for infrastructure planning

### Logging

1. **Use Appropriate Levels**: Don't log everything as ERROR
2. **Include Context**: Add relevant metadata to logs
3. **Protect Sensitive Data**: Never log passwords or tokens
4. **Monitor Log Volume**: Watch for excessive logging
5. **Regular Review**: Review error logs regularly

---

## Troubleshooting

### Backup Issues

**Problem**: Backup fails with "pg_dump: command not found"
- **Solution**: Install PostgreSQL client tools on the server

**Problem**: Backup upload fails
- **Solution**: Check storage credentials and network connectivity

**Problem**: Restore fails with validation error
- **Solution**: Verify backup file integrity, try downloading and inspecting

### Monitoring Issues

**Problem**: Metrics not updating
- **Solution**: Check if monitoring job is running, restart if needed

**Problem**: Alerts not being sent
- **Solution**: Verify email service configuration and ADMIN_EMAIL setting

**Problem**: High false positive alerts
- **Solution**: Adjust alert thresholds in the monitoring service

### Logging Issues

**Problem**: Log files growing too large
- **Solution**: Check log rotation settings, reduce log level if needed

**Problem**: Missing request context
- **Solution**: Ensure requestLoggerMiddleware is properly configured

---

## Security Considerations

1. **Access Control**: All admin endpoints require authentication
2. **Backup Encryption**: Consider encrypting backups at rest
3. **Secure Storage**: Use private buckets for backup storage
4. **Alert Sensitivity**: Don't include sensitive data in alerts
5. **Log Sanitization**: Ensure logs don't contain sensitive information

---

## Support

For issues or questions:
1. Check application logs in `logs/` directory
2. Review health check endpoints
3. Check alert history for recent issues
4. Contact system administrator

---

## Version History

- **v1.0.0** (2025-11-12): Initial implementation
  - Automated database backups
  - Health check endpoints
  - System metrics collection
  - Alert system
  - Structured logging
