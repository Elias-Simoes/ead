# Performance Testing Guide

## Overview
This guide describes how to run performance tests for the Plataforma EAD and interpret the results.

## Running Performance Tests

### Prerequisites
1. Ensure the API server is running
2. Ensure PostgreSQL and Redis are running
3. Have test data in the database

### Run Tests
```bash
# Run performance tests
node test-performance.js

# Run with custom API URL
API_URL=http://localhost:3000 node test-performance.js
```

## Test Scenarios

### 1. Health Check Endpoint
- **Purpose**: Verify basic server responsiveness
- **Target**: < 100ms response time
- **Endpoint**: `GET /health`

### 2. Published Courses List
- **Purpose**: Test caching effectiveness for frequently accessed data
- **Target**: 
  - First request: < 2s
  - Cached requests: < 500ms
- **Endpoint**: `GET /api/courses`
- **Cache TTL**: 15 minutes

### 3. Student Progress
- **Purpose**: Test caching for user-specific data
- **Target**:
  - First request: < 2s
  - Cached requests: < 500ms
- **Endpoint**: `GET /api/students/courses/progress`
- **Cache TTL**: 5 minutes

### 4. Concurrent Requests
- **Purpose**: Test system behavior under load
- **Target**: Handle 50+ concurrent requests
- **Metrics**:
  - Total time to complete all requests
  - Average response time
  - Success rate

### 5. Pagination Performance
- **Purpose**: Verify pagination doesn't degrade performance
- **Target**: < 2s for all page sizes
- **Page Sizes Tested**: 10, 20, 50 items

### 6. Cache Invalidation
- **Purpose**: Verify cache is properly invalidated on updates
- **Target**: Cached data should be served correctly

## Performance Targets

### Response Time Requirements
- **P50 (Median)**: < 500ms
- **P95**: < 2000ms (2 seconds)
- **P99**: < 5000ms (5 seconds)
- **Maximum**: 30 seconds (query timeout)

### Throughput Requirements
- **Concurrent Users**: 100+
- **Requests per Minute**: 1000+
- **Cache Hit Rate**: > 70%

### Resource Limits
- **CPU Usage**: < 70% average
- **Memory Usage**: < 80% of available
- **Database Connections**: < 80% of pool size

## Interpreting Results

### Response Time Statistics
```
Min: 45ms          # Fastest response (likely cached)
Max: 1850ms        # Slowest response
Average: 320ms     # Mean response time
Median (P50): 280ms    # 50% of requests faster than this
P95: 1200ms        # 95% of requests faster than this
P99: 1750ms        # 99% of requests faster than this
```

### Performance Assessment
- **Excellent**: P95 < 500ms
- **Good**: P95 < 1000ms
- **Acceptable**: P95 < 2000ms
- **Poor**: P95 > 2000ms

### Cache Performance
```
Cache Hits: 12     # Requests served from cache
Cache Misses: 4    # Requests that hit database
Hit Rate: 75%      # Percentage of cache hits
```

### Cache Assessment
- **Excellent**: Hit rate > 80%
- **Good**: Hit rate > 70%
- **Acceptable**: Hit rate > 60%
- **Poor**: Hit rate < 60%

## Optimization Strategies

### If Response Times Are Slow

#### 1. Check Database Queries
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 2. Verify Indexes
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;
```

#### 3. Review Cache Configuration
- Increase cache TTL for stable data
- Decrease cache TTL for frequently changing data
- Add caching to more endpoints

#### 4. Optimize Queries
- Add missing indexes
- Reduce JOIN complexity
- Use pagination
- Implement eager loading

### If Cache Hit Rate Is Low

#### 1. Increase Cache TTL
```typescript
// Increase TTL for stable data
const CACHE_TTL = {
  SHORT: 600,    // 10 minutes (was 5)
  MEDIUM: 1800,  // 30 minutes (was 15)
  LONG: 7200,    // 2 hours (was 1)
};
```

#### 2. Add More Caching
- Cache frequently accessed endpoints
- Cache computed results
- Cache user sessions

#### 3. Optimize Cache Keys
- Use consistent key naming
- Include relevant parameters
- Avoid overly specific keys

### If Concurrent Load Fails

#### 1. Increase Connection Pool
```typescript
// In database.ts
max: 30,  // Increase from 20
```

#### 2. Add Rate Limiting
```typescript
// Protect against overload
rateLimit({
  windowMs: 60000,
  max: 100,
});
```

#### 3. Implement Queue System
- Use Bull for background jobs
- Defer non-critical operations
- Batch similar requests

## Load Testing Tools

### Apache JMeter
```bash
# Install JMeter
brew install jmeter  # macOS
apt-get install jmeter  # Linux

# Run test plan
jmeter -n -t test-plan.jmx -l results.jtl
```

### k6
```bash
# Install k6
brew install k6  # macOS

# Run load test
k6 run load-test.js
```

### Artillery
```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## Continuous Performance Monitoring

### Application Performance Monitoring (APM)
Consider implementing:
- **New Relic**: Full-stack monitoring
- **Datadog**: Infrastructure and APM
- **Prometheus + Grafana**: Open-source monitoring

### Key Metrics to Monitor
1. **Response Time**: Track P50, P95, P99
2. **Throughput**: Requests per second
3. **Error Rate**: Failed requests percentage
4. **Cache Hit Rate**: Cache effectiveness
5. **Database Performance**: Query times, connection pool usage
6. **Resource Usage**: CPU, memory, disk I/O

### Alerting Thresholds
```yaml
alerts:
  - name: High Response Time
    condition: p95_response_time > 2000ms
    duration: 5 minutes
    
  - name: Low Cache Hit Rate
    condition: cache_hit_rate < 60%
    duration: 10 minutes
    
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5 minutes
    
  - name: Database Connection Pool Exhausted
    condition: db_connections > 18  # 90% of 20
    duration: 2 minutes
```

## Performance Testing Best Practices

### 1. Test in Production-Like Environment
- Use similar hardware specs
- Same database size and data distribution
- Realistic network conditions

### 2. Test with Realistic Data
- Use production-like data volumes
- Include edge cases
- Test with various user roles

### 3. Test Regularly
- Run performance tests on every release
- Include in CI/CD pipeline
- Monitor trends over time

### 4. Test Different Scenarios
- Normal load
- Peak load
- Sustained load
- Spike load
- Stress testing (beyond capacity)

### 5. Document Baselines
- Record baseline performance metrics
- Track performance over time
- Set regression thresholds

## Troubleshooting Common Issues

### Issue: Inconsistent Response Times
**Possible Causes:**
- Cache warming not complete
- Database query plan changes
- Network latency variations

**Solutions:**
- Run warm-up requests before testing
- Use EXPLAIN ANALYZE to check query plans
- Test from same network location

### Issue: Memory Leaks
**Symptoms:**
- Increasing memory usage over time
- Slower responses over time
- Server crashes under load

**Solutions:**
- Profile memory usage
- Check for unclosed connections
- Review event listener cleanup
- Monitor garbage collection

### Issue: Database Connection Pool Exhaustion
**Symptoms:**
- "Connection pool exhausted" errors
- Requests timing out
- Increasing queue length

**Solutions:**
- Increase pool size
- Reduce connection hold time
- Implement connection pooling best practices
- Use read replicas for read-heavy operations

## Performance Optimization Checklist

### Application Level
- [ ] Enable response compression
- [ ] Implement caching strategy
- [ ] Use connection pooling
- [ ] Optimize serialization
- [ ] Minimize middleware overhead
- [ ] Use async/await properly
- [ ] Implement pagination
- [ ] Use lazy loading

### Database Level
- [ ] Add appropriate indexes
- [ ] Optimize query patterns
- [ ] Use prepared statements
- [ ] Implement query caching
- [ ] Regular VACUUM and ANALYZE
- [ ] Monitor slow queries
- [ ] Use connection pooling
- [ ] Consider read replicas

### Infrastructure Level
- [ ] Use CDN for static assets
- [ ] Enable HTTP/2
- [ ] Optimize network configuration
- [ ] Use load balancing
- [ ] Implement auto-scaling
- [ ] Monitor resource usage
- [ ] Set up proper logging
- [ ] Configure alerting

## Next Steps

After running performance tests:

1. **Review Results**: Analyze metrics and identify bottlenecks
2. **Prioritize Issues**: Focus on high-impact optimizations
3. **Implement Fixes**: Apply optimizations systematically
4. **Re-test**: Verify improvements
5. **Monitor**: Track performance in production
6. **Iterate**: Continuously improve performance

## Resources

- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Redis Performance Optimization](https://redis.io/topics/optimization)
- [Express.js Performance Tips](https://expressjs.com/en/advanced/best-practice-performance.html)
