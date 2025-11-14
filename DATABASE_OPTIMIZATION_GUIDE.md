# Database Optimization Guide

## Overview
This document describes the database optimization strategies implemented in the Plataforma EAD to ensure optimal performance.

## Indexes Added

### Courses Table
- `idx_courses_status_published_at`: Composite index for filtering published courses ordered by publication date
- `idx_courses_category`: Index for category filtering
- `idx_courses_instructor_status`: Composite index for instructor's courses by status
- `idx_courses_title_search`: Full-text search index on title
- `idx_courses_description_search`: Full-text search index on description

### Student Progress Table
- `idx_student_progress_student_last_accessed`: Optimizes student progress queries ordered by last access
- `idx_student_progress_course`: Index for course-based queries
- `idx_student_progress_completed`: Partial index for completed courses
- `idx_student_progress_percentage`: Index for progress percentage queries

### Subscriptions Table
- `idx_subscriptions_student_status`: Composite index for student subscription status
- `idx_subscriptions_period_end`: Partial index for active subscriptions expiring soon
- `idx_subscriptions_gateway_id`: Index for gateway integration lookups

### Payments Table
- `idx_payments_subscription_status`: Composite index for payment status by subscription
- `idx_payments_created_at`: Index for chronological queries
- `idx_payments_gateway_id`: Index for gateway integration lookups

### Assessments & Questions
- `idx_assessments_course`: Index for course assessments
- `idx_questions_assessment_order`: Composite index for ordered questions
- `idx_student_assessments_status`: Partial index for pending assessments

### Certificates Table
- `idx_certificates_student`: Index for student certificates
- `idx_certificates_course`: Index for course certificates
- `idx_certificates_issued_at`: Index for chronological queries

## Connection Pool Optimization

### Configuration
```typescript
{
  max: 20,              // Maximum connections
  min: 2,               // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  maxUses: 7500,        // Recycle connections
  statement_timeout: 30000  // Query timeout
}
```

### Benefits
- Maintains minimum connections for quick response
- Recycles connections to prevent memory leaks
- Prevents long-running queries from blocking
- Optimizes resource usage

## Query Optimization Best Practices

### 1. Use Pagination
All list endpoints implement pagination:
```typescript
async getPublishedCourses(
  page: number = 1,
  limit: number = 20,
  category?: string,
  search?: string
)
```

### 2. Eager Loading
Load related data in single queries to avoid N+1 problems:
```sql
SELECT c.*, u.name as instructor_name
FROM courses c
INNER JOIN users u ON c.instructor_id = u.id
```

### 3. Selective Column Retrieval
Only select needed columns instead of `SELECT *` when possible.

### 4. Use Partial Indexes
Create indexes with WHERE clauses for specific query patterns:
```sql
CREATE INDEX idx_subscriptions_period_end 
ON subscriptions(current_period_end) 
WHERE status = 'active';
```

### 5. Full-Text Search
Use PostgreSQL's full-text search for text queries:
```sql
CREATE INDEX idx_courses_title_search 
ON courses USING gin(to_tsvector('english', title));
```

## Cache Strategy

### Cache Layers
1. **Redis Cache**: Application-level caching
2. **Query Result Cache**: Database query results
3. **Connection Pool**: Reused database connections

### Cache TTLs
- Course details: 1 hour
- Published courses list: 15 minutes
- Student progress: 5 minutes

### Cache Invalidation
- Automatic invalidation on data updates
- Pattern-based invalidation for related data
- Manual invalidation for critical operations

## Monitoring Queries

### Slow Query Logging
Enable in PostgreSQL configuration:
```sql
log_min_duration_statement = 1000  -- Log queries > 1 second
```

### Query Analysis
Use EXPLAIN ANALYZE to understand query performance:
```sql
EXPLAIN ANALYZE
SELECT * FROM courses WHERE status = 'published';
```

### Index Usage
Check index usage:
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Performance Targets

### Response Times
- 95% of queries: < 100ms
- 99% of queries: < 500ms
- Maximum query time: 30 seconds (timeout)

### Throughput
- Support 100+ concurrent connections
- Handle 1000+ requests per minute
- Maintain < 2s API response time

## Maintenance Tasks

### Regular Tasks
1. **VACUUM**: Run weekly to reclaim storage
2. **ANALYZE**: Update statistics after bulk operations
3. **REINDEX**: Rebuild indexes quarterly
4. **Monitor**: Check slow query logs daily

### Commands
```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex specific table
REINDEX TABLE courses;

-- Check table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### High CPU Usage
- Check for missing indexes
- Look for sequential scans in EXPLAIN plans
- Review slow query log

### High Memory Usage
- Reduce connection pool size
- Check for memory leaks in queries
- Review work_mem settings

### Slow Queries
- Add appropriate indexes
- Optimize JOIN operations
- Use EXPLAIN ANALYZE to identify bottlenecks
- Consider query rewriting

## Future Optimizations

### Potential Improvements
1. **Read Replicas**: Separate read and write operations
2. **Partitioning**: Partition large tables by date
3. **Materialized Views**: Pre-compute complex aggregations
4. **Query Caching**: Implement query result caching
5. **Connection Pooling**: Use PgBouncer for better connection management

### Scaling Strategy
1. Vertical scaling: Increase database resources
2. Horizontal scaling: Add read replicas
3. Sharding: Partition data across multiple databases
4. Caching: Increase cache hit ratio
