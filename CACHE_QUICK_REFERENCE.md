# Cache Implementation - Quick Reference

## Using the Cache Service

### Import
```typescript
import { cacheService } from '@shared/services/cache.service';
```

### Basic Operations

#### Get from Cache
```typescript
const data = await cacheService.get<MyType>('my-key');
if (data) {
  // Use cached data
} else {
  // Cache miss - fetch from database
}
```

#### Set in Cache
```typescript
// With TTL
await cacheService.set('my-key', data, 3600); // 1 hour

// Without TTL (no expiration)
await cacheService.set('my-key', data);
```

#### Delete from Cache
```typescript
// Single key
await cacheService.delete('my-key');

// Pattern-based deletion
await cacheService.deletePattern('courses:*');
```

### Advanced Patterns

#### Get or Set Pattern
```typescript
const data = await cacheService.getOrSet(
  'my-key',
  async () => {
    // Fetch from database
    return await database.query('SELECT * FROM table');
  },
  3600 // TTL in seconds
);
```

#### Generate Cache Keys
```typescript
const cacheKey = cacheService.generateKey('course', courseId);
// Result: 'course:123'

const cacheKey = cacheService.generateKey('courses', 'published', page, limit);
// Result: 'courses:published:1:20'
```

### TTL Presets
```typescript
const TTL = cacheService.getTTLPresets();

// Available presets:
TTL.SHORT      // 300s (5 minutes)
TTL.MEDIUM     // 900s (15 minutes)
TTL.LONG       // 3600s (1 hour)
TTL.VERY_LONG  // 86400s (24 hours)
```

## Implementation Examples

### Example 1: Caching a List
```typescript
async getPublishedCourses(page: number = 1, limit: number = 20) {
  const cacheKey = cacheService.generateKey('courses', 'published', page, limit);
  
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      // Fetch from database
      const result = await pool.query(
        'SELECT * FROM courses WHERE status = $1 LIMIT $2 OFFSET $3',
        ['published', limit, (page - 1) * limit]
      );
      return result.rows;
    },
    cacheService.getTTLPresets().MEDIUM // 15 minutes
  );
}
```

### Example 2: Caching with Invalidation
```typescript
async updateCourse(courseId: string, data: UpdateData) {
  // Update in database
  const result = await pool.query(
    'UPDATE courses SET title = $1 WHERE id = $2 RETURNING *',
    [data.title, courseId]
  );
  
  // Invalidate cache
  await cacheService.delete(cacheService.generateKey('course', courseId));
  await cacheService.deletePattern('courses:published:*');
  
  return result.rows[0];
}
```

### Example 3: User-Specific Cache
```typescript
async getStudentProgress(studentId: string) {
  const cacheKey = cacheService.generateKey('progress', 'student', studentId);
  
  return await cacheService.getOrSet(
    cacheKey,
    async () => {
      const result = await pool.query(
        'SELECT * FROM student_progress WHERE student_id = $1',
        [studentId]
      );
      return result.rows;
    },
    cacheService.getTTLPresets().SHORT // 5 minutes
  );
}

async updateProgress(studentId: string, courseId: string, data: any) {
  // Update in database
  await pool.query('UPDATE student_progress SET ...');
  
  // Invalidate user-specific cache
  const cacheKey = cacheService.generateKey('progress', 'student', studentId);
  await cacheService.delete(cacheKey);
}
```

## Cache Key Naming Conventions

### Pattern
```
{resource}:{identifier}:{parameters}
```

### Examples
```typescript
// Single resource
'course:123'
'user:456'
'certificate:789'

// List with filters
'courses:published:1:20'           // page 1, limit 20
'courses:published:1:20:tech:none' // page 1, limit 20, category tech, no search

// User-specific
'progress:student:123'
'subscriptions:student:456'

// Nested resources
'course:details:123'
'assessment:questions:789'
```

## Cache Invalidation Strategies

### 1. Direct Invalidation
Invalidate specific key when data changes:
```typescript
await cacheService.delete(cacheService.generateKey('course', courseId));
```

### 2. Pattern-Based Invalidation
Invalidate multiple related keys:
```typescript
// Invalidate all published course lists
await cacheService.deletePattern('courses:published:*');

// Invalidate all course-related caches
await cacheService.deletePattern('course:*');
```

### 3. TTL-Based Invalidation
Let cache expire naturally:
```typescript
// Set short TTL for frequently changing data
await cacheService.set('key', data, 300); // 5 minutes
```

### 4. Hybrid Approach
Combine TTL with manual invalidation:
```typescript
// Set TTL as safety net
await cacheService.set('key', data, 3600);

// Manually invalidate on updates
await cacheService.delete('key');
```

## Best Practices

### 1. Choose Appropriate TTL
- **Stable data** (courses, users): 1 hour
- **Semi-dynamic data** (lists): 15 minutes
- **Dynamic data** (progress, stats): 5 minutes
- **Real-time data**: Don't cache or use very short TTL

### 2. Use Consistent Key Naming
```typescript
// Good
const CACHE_KEYS = {
  COURSE: 'course',
  COURSE_DETAILS: 'course:details',
  PUBLISHED_COURSES: 'courses:published',
};

// Use constants
const key = cacheService.generateKey(CACHE_KEYS.COURSE, courseId);
```

### 3. Handle Cache Failures Gracefully
```typescript
try {
  const cached = await cacheService.get('key');
  if (cached) return cached;
} catch (error) {
  logger.error('Cache error', error);
  // Continue without cache
}

// Fetch from database
return await fetchFromDatabase();
```

### 4. Invalidate Related Caches
```typescript
async updateCourse(courseId: string, data: any) {
  // Update database
  await pool.query('UPDATE courses ...');
  
  // Invalidate all related caches
  await cacheService.delete(cacheService.generateKey('course', courseId));
  await cacheService.delete(cacheService.generateKey('course:details', courseId));
  await cacheService.deletePattern('courses:published:*');
}
```

### 5. Monitor Cache Performance
```typescript
// Log cache hits/misses
const cached = await cacheService.get('key');
if (cached) {
  logger.debug('Cache hit', { key });
} else {
  logger.debug('Cache miss', { key });
}
```

## Common Patterns

### Pattern 1: Cache-Aside (Lazy Loading)
```typescript
async getData(id: string) {
  // Try cache first
  const cached = await cacheService.get(`data:${id}`);
  if (cached) return cached;
  
  // Fetch from database
  const data = await database.query('SELECT * FROM table WHERE id = $1', [id]);
  
  // Store in cache
  await cacheService.set(`data:${id}`, data, 3600);
  
  return data;
}
```

### Pattern 2: Write-Through
```typescript
async updateData(id: string, data: any) {
  // Update database
  await database.query('UPDATE table SET ... WHERE id = $1', [id]);
  
  // Update cache immediately
  await cacheService.set(`data:${id}`, data, 3600);
}
```

### Pattern 3: Write-Behind (Invalidate)
```typescript
async updateData(id: string, data: any) {
  // Update database
  await database.query('UPDATE table SET ... WHERE id = $1', [id]);
  
  // Invalidate cache (will be refreshed on next read)
  await cacheService.delete(`data:${id}`);
}
```

## Troubleshooting

### Cache Not Working
1. Check Redis connection: `redis-cli ping`
2. Verify cache keys: `redis-cli keys '*'`
3. Check TTL: `redis-cli ttl <key>`
4. Review logs for errors

### Stale Data
1. Verify cache invalidation is called
2. Check TTL is appropriate
3. Ensure pattern matching is correct
4. Review invalidation logic

### High Memory Usage
1. Check cache size: `redis-cli info memory`
2. Review TTL settings
3. Implement cache eviction policy
4. Consider reducing cache scope

### Low Cache Hit Rate
1. Verify cache is being populated
2. Check if TTL is too short
3. Review cache key generation
4. Analyze access patterns

## Monitoring Commands

### Redis CLI
```bash
# Check connection
redis-cli ping

# List all keys
redis-cli keys '*'

# Get key value
redis-cli get <key>

# Check TTL
redis-cli ttl <key>

# Monitor operations
redis-cli monitor

# Get memory info
redis-cli info memory

# Get stats
redis-cli info stats
```

### Application Logs
```bash
# Watch cache operations
tail -f logs/app.log | grep -i cache

# Count cache hits/misses
grep "Cache hit" logs/app.log | wc -l
grep "Cache miss" logs/app.log | wc -l
```

## Performance Tips

1. **Batch Operations**: Use `mget` and `mset` for multiple keys
2. **Compression**: Consider compressing large cached values
3. **Serialization**: Use efficient serialization (JSON is default)
4. **Key Size**: Keep cache keys short but descriptive
5. **Value Size**: Avoid caching very large objects
6. **TTL Strategy**: Balance freshness vs performance
7. **Monitoring**: Track cache hit rate and adjust strategy

## Related Documentation
- [DATABASE_OPTIMIZATION_GUIDE.md](./DATABASE_OPTIMIZATION_GUIDE.md)
- [PERFORMANCE_TESTING_GUIDE.md](./PERFORMANCE_TESTING_GUIDE.md)
- [TASK_13_CACHE_PERFORMANCE_SUMMARY.md](./TASK_13_CACHE_PERFORMANCE_SUMMARY.md)
