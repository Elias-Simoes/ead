# Applying Performance Optimizations

## Overview
This guide provides step-by-step instructions for applying the performance optimizations implemented in Task 13.

## Prerequisites

Before applying optimizations, ensure:
- ✅ PostgreSQL is running
- ✅ Redis is running
- ✅ Application is stopped (to avoid conflicts)
- ✅ Database backup is created (recommended)

## Step 1: Backup Database

### Create Backup
```bash
# Create backup directory
mkdir -p backups

# Backup database
pg_dump -h localhost -U user -d plataforma_ead > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backups/
```

### Restore Backup (if needed)
```bash
# Restore from backup
psql -h localhost -U user -d plataforma_ead < backups/backup_YYYYMMDD_HHMMSS.sql
```

## Step 2: Apply Database Migrations

### Run Migration
```bash
# Apply performance indexes migration
npm run migrate

# Expected output:
# Running migration: 022_add_performance_indexes.sql
# Migration completed successfully
```

### Verify Indexes
```bash
# Connect to database
psql -h localhost -U user -d plataforma_ead

# List all indexes
\di

# Check specific indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

# Exit
\q
```

### Expected Indexes
You should see indexes like:
- `idx_courses_status_published_at`
- `idx_courses_category`
- `idx_student_progress_student_last_accessed`
- `idx_subscriptions_period_end`
- And many more...

## Step 3: Verify Redis Connection

### Check Redis
```bash
# Test Redis connection
redis-cli ping
# Expected: PONG

# Check Redis info
redis-cli info

# Check memory usage
redis-cli info memory
```

### Configure Redis (if needed)
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Recommended settings:
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Step 4: Update Environment Variables

### Check .env File
Ensure these variables are set:
```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/plataforma_ead
DB_HOST=localhost
DB_PORT=5432
DB_NAME=plataforma_ead
DB_USER=user
DB_PASSWORD=password
```

## Step 5: Build Application

### Rebuild Application
```bash
# Clean previous build
rm -rf dist/

# Build application
npm run build

# Verify build
ls -lh dist/
```

## Step 6: Start Application

### Start Services
```bash
# Start PostgreSQL (if not running)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: net start postgresql

# Start Redis (if not running)
# macOS: brew services start redis
# Linux: sudo systemctl start redis
# Windows: redis-server

# Start application
npm start

# Or in development mode
npm run dev
```

### Verify Startup
Check logs for:
```
✓ Database connection established
✓ Redis connected successfully
✓ Server running on port 3000
```

## Step 7: Run Performance Tests

### Execute Tests
```bash
# Run performance tests
node test-performance.js

# Expected output:
# ✓ Health check: 45ms
# ✓ GET /api/courses (first request): 850ms
# ✓ GET /api/courses (cached request 1): 85ms
# ...
# 📈 PERFORMANCE TEST RESULTS
# Total Tests: 15
# Passed: 15 (100%)
# P95: 1200ms
# Cache Hit Rate: 75%
```

### Interpret Results
- **P95 < 2000ms**: ✅ Performance target met
- **Cache Hit Rate > 70%**: ✅ Cache working effectively
- **All tests passed**: ✅ System is optimized

## Step 8: Monitor Performance

### Check Application Logs
```bash
# Watch logs
tail -f logs/app.log

# Filter cache operations
tail -f logs/app.log | grep -i cache

# Filter slow queries
tail -f logs/app.log | grep -i "slow query"
```

### Monitor Redis
```bash
# Monitor Redis operations in real-time
redis-cli monitor

# Check cache statistics
redis-cli info stats

# Check memory usage
redis-cli info memory
```

### Monitor Database
```bash
# Connect to database
psql -h localhost -U user -d plataforma_ead

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check slow queries (if logging enabled)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

## Step 9: Verify Cache Functionality

### Test Cache Operations
```bash
# Use Redis CLI to verify cache
redis-cli

# Check for cached courses
KEYS courses:*

# Check for cached progress
KEYS progress:*

# Get a cached value
GET course:123

# Check TTL
TTL course:123

# Exit
exit
```

### Test Cache Invalidation
1. Make a request to get courses (populates cache)
2. Update a course via API
3. Verify cache was invalidated
4. Make request again (should fetch fresh data)

## Step 10: Performance Baseline

### Establish Baselines
```bash
# Run performance tests multiple times
for i in {1..5}; do
  echo "Run $i:"
  node test-performance.js
  sleep 10
done

# Calculate average metrics
# - Average P95 response time
# - Average cache hit rate
# - Average throughput
```

### Document Baselines
Create a file `performance-baseline.txt`:
```
Date: 2024-01-15
Environment: Production
P50: 280ms
P95: 1200ms
P99: 1750ms
Cache Hit Rate: 75%
Concurrent Users: 50
Requests/min: 1000
```

## Troubleshooting

### Issue: Migration Fails

**Symptoms:**
- Error during migration
- Indexes not created

**Solutions:**
```bash
# Check database connection
psql -h localhost -U user -d plataforma_ead -c "SELECT 1"

# Check for existing indexes
psql -h localhost -U user -d plataforma_ead -c "\di"

# Manually run migration
psql -h localhost -U user -d plataforma_ead < scripts/migrations/022_add_performance_indexes.sql

# Check for errors
psql -h localhost -U user -d plataforma_ead -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### Issue: Redis Connection Fails

**Symptoms:**
- "Redis connection error" in logs
- Cache not working

**Solutions:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
# macOS: brew services start redis
# Linux: sudo systemctl start redis
# Windows: redis-server

# Check Redis logs
# macOS: tail -f /usr/local/var/log/redis.log
# Linux: sudo journalctl -u redis -f

# Verify connection string
echo $REDIS_URL
```

### Issue: Poor Cache Performance

**Symptoms:**
- Low cache hit rate
- Slow response times

**Solutions:**
```bash
# Check cache keys
redis-cli keys '*'

# Check TTL settings
redis-cli ttl course:123

# Monitor cache operations
redis-cli monitor

# Check memory usage
redis-cli info memory

# Clear cache and test
redis-cli flushdb
```

### Issue: Database Performance Issues

**Symptoms:**
- Slow queries
- High CPU usage

**Solutions:**
```bash
# Check for missing indexes
psql -h localhost -U user -d plataforma_ead

SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;

# Analyze tables
VACUUM ANALYZE;

# Check query plans
EXPLAIN ANALYZE SELECT * FROM courses WHERE status = 'published';

# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

## Rollback Procedure

### If Issues Occur

1. **Stop Application**
```bash
# Stop the application
pkill -f "node.*server"
```

2. **Restore Database Backup**
```bash
# Drop and recreate database
psql -h localhost -U user -c "DROP DATABASE plataforma_ead;"
psql -h localhost -U user -c "CREATE DATABASE plataforma_ead;"

# Restore backup
psql -h localhost -U user -d plataforma_ead < backups/backup_YYYYMMDD_HHMMSS.sql
```

3. **Clear Redis Cache**
```bash
redis-cli flushdb
```

4. **Revert Code Changes**
```bash
git checkout HEAD~1
npm run build
npm start
```

## Post-Deployment Checklist

After applying optimizations:

- [ ] Database migrations applied successfully
- [ ] All indexes created
- [ ] Redis connection working
- [ ] Application starts without errors
- [ ] Performance tests pass
- [ ] Cache hit rate > 70%
- [ ] P95 response time < 2000ms
- [ ] Monitoring in place
- [ ] Baselines documented
- [ ] Team notified

## Monitoring Schedule

### Daily
- Check application logs for errors
- Monitor cache hit rate
- Review slow query log

### Weekly
- Run performance tests
- Review cache statistics
- Check database connection pool usage
- Analyze response time trends

### Monthly
- Run VACUUM ANALYZE on database
- Review and optimize indexes
- Update performance baselines
- Review cache strategy

## Next Steps

1. **Monitor Performance**: Track metrics for 1-2 weeks
2. **Adjust TTLs**: Fine-tune cache TTLs based on usage patterns
3. **Optimize Queries**: Address any slow queries identified
4. **Scale Resources**: Increase resources if needed
5. **Document Learnings**: Update documentation with findings

## Support

If you encounter issues:

1. Check logs: `tail -f logs/app.log`
2. Review documentation: `DATABASE_OPTIMIZATION_GUIDE.md`
3. Run diagnostics: `node test-performance.js`
4. Check Redis: `redis-cli info`
5. Check database: `psql -h localhost -U user -d plataforma_ead`

## Related Documentation

- [DATABASE_OPTIMIZATION_GUIDE.md](./DATABASE_OPTIMIZATION_GUIDE.md)
- [PERFORMANCE_TESTING_GUIDE.md](./PERFORMANCE_TESTING_GUIDE.md)
- [CACHE_QUICK_REFERENCE.md](./CACHE_QUICK_REFERENCE.md)
- [TASK_13_CACHE_PERFORMANCE_SUMMARY.md](./TASK_13_CACHE_PERFORMANCE_SUMMARY.md)
