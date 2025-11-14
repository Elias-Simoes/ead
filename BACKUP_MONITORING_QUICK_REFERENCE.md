# Backup & Monitoring - Quick Reference

## 🔄 Backup Operations

### List Backups
```bash
curl -X GET http://localhost:3000/api/admin/backup/list \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Create Manual Backup
```bash
curl -X POST http://localhost:3000/api/admin/backup/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Restore from Backup
```bash
curl -X POST http://localhost:3000/api/admin/backup/restore \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup-2025-11-12T03-00-00-000Z.sql"}'
```

### Download Backup
```bash
curl -X GET http://localhost:3000/api/admin/backup/download/backup-2025-11-12T03-00-00-000Z.sql \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o backup.sql
```

## 🏥 Health Checks

### Basic Health
```bash
curl http://localhost:3000/health
```

### Database Health
```bash
curl http://localhost:3000/health/db
```

### Redis Health
```bash
curl http://localhost:3000/health/redis
```

### All Services
```bash
curl http://localhost:3000/health/all
```

### Kubernetes Probes
```bash
# Readiness
curl http://localhost:3000/health/ready

# Liveness
curl http://localhost:3000/health/live
```

## 📊 Monitoring

### Current Metrics
```bash
curl -X GET http://localhost:3000/api/admin/monitoring/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Metrics History
```bash
curl -X GET "http://localhost:3000/api/admin/monitoring/metrics/history?limit=100" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Average Metrics (Last 5 Minutes)
```bash
curl -X GET "http://localhost:3000/api/admin/monitoring/metrics/average?minutes=5" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Alert History
```bash
curl -X GET "http://localhost:3000/api/admin/monitoring/alerts?limit=100" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Alert
```bash
curl -X POST http://localhost:3000/api/admin/monitoring/alerts/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📝 Logging

### Log Levels
```typescript
logger.error('Error message', error, { userId: '123' });
logger.warn('Warning message', { context: 'data' });
logger.info('Info message', { action: 'completed' });
logger.debug('Debug message', { details: 'verbose' });
```

### Log Files Location
```
logs/
├── error-2025-11-12.log      # Error logs only
├── combined-2025-11-12.log   # All logs
└── ...                        # Rotated logs (30 days)
```

### View Recent Logs
```bash
# Windows
type logs\combined-2025-11-12.log | findstr /C:"ERROR"

# Linux/Mac
tail -f logs/combined-$(date +%Y-%m-%d).log
```

## ⚙️ Configuration

### Environment Variables
```env
# Logging
LOG_LEVEL=info

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 3 * * *
BACKUP_RETENTION_DAYS=30

# Monitoring
ADMIN_EMAIL=admin@plataforma-ead.com
```

### Cron Schedule Examples
```
0 3 * * *     # Daily at 3:00 AM
0 */6 * * *   # Every 6 hours
0 0 * * 0     # Weekly on Sunday at midnight
0 2 * * 1-5   # Weekdays at 2:00 AM
```

## 🚨 Alert Thresholds

| Resource | Threshold | Severity |
|----------|-----------|----------|
| CPU      | 80%       | High     |
| Memory   | 85%       | High     |
| Disk     | 90%       | Critical |
| Response | 5s        | High     |

## 🔍 Troubleshooting

### Check Backup Status
```bash
# List recent backups
curl http://localhost:3000/api/admin/backup/list \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check logs
type logs\error-2025-11-12.log | findstr /C:"backup"
```

### Check Service Health
```bash
# All services
curl http://localhost:3000/health/all

# Specific service
curl http://localhost:3000/health/db
curl http://localhost:3000/health/redis
```

### Check System Metrics
```bash
curl http://localhost:3000/api/admin/monitoring/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Check Alerts
```bash
curl http://localhost:3000/api/admin/monitoring/alerts \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📦 Dependencies

```json
{
  "winston": "^3.11.0",
  "winston-daily-rotate-file": "^4.7.1",
  "node-cron": "^4.2.1"
}
```

## 🎯 Common Tasks

### Manual Backup Before Maintenance
```bash
curl -X POST http://localhost:3000/api/admin/backup/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Restore After Issue
```bash
# 1. List backups
curl http://localhost:3000/api/admin/backup/list \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 2. Restore from backup
curl -X POST http://localhost:3000/api/admin/backup/restore \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup-YYYY-MM-DDTHH-mm-ss-sssZ.sql"}'
```

### Monitor System Health
```bash
# Quick check
curl http://localhost:3000/health/all

# Detailed metrics
curl http://localhost:3000/api/admin/monitoring/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Alert System
```bash
curl -X POST http://localhost:3000/api/admin/monitoring/alerts/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📚 Documentation

- Full Guide: `BACKUP_MONITORING_GUIDE.md`
- Implementation Summary: `TASK_14_BACKUP_MONITORING_SUMMARY.md`
- API Documentation: See full guide for detailed endpoint specs

## 🆘 Support

1. Check logs: `logs/error-YYYY-MM-DD.log`
2. Check health: `GET /health/all`
3. Check alerts: `GET /api/admin/monitoring/alerts`
4. Review metrics: `GET /api/admin/monitoring/metrics`
