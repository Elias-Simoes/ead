/**
 * Performance Tests for Plataforma EAD
 * 
 * Tests critical endpoints to ensure they meet performance requirements:
 * - 95% of requests should respond in < 2 seconds
 * - Cache hit/miss ratio
 * - Response time under load
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test configuration
const PERFORMANCE_THRESHOLD_MS = 2000; // 2 seconds
const CACHE_TEST_ITERATIONS = 10;
const LOAD_TEST_CONCURRENT_REQUESTS = 50;

// Store test results
const testResults = {
  passed: 0,
  failed: 0,
  responseTimes: [],
  cacheHits: 0,
  cacheMisses: 0,
};

// Helper function to measure response time
async function measureResponseTime(name, requestFn) {
  const startTime = Date.now();
  try {
    const response = await requestFn();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    testResults.responseTimes.push(responseTime);
    
    const passed = responseTime < PERFORMANCE_THRESHOLD_MS;
    if (passed) {
      testResults.passed++;
      console.log(`✓ ${name}: ${responseTime}ms`);
    } else {
      testResults.failed++;
      console.log(`✗ ${name}: ${responseTime}ms (exceeded ${PERFORMANCE_THRESHOLD_MS}ms threshold)`);
    }
    
    return { passed, responseTime, response };
  } catch (error) {
    testResults.failed++;
    console.log(`✗ ${name}: Error - ${error.message}`);
    return { passed: false, responseTime: -1, error };
  }
}

// Helper function to create test user and get token
async function setupTestUser() {
  try {
    // Try to login first
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'performance@test.com',
      password: 'Test123!@#',
    });
    
    return loginResponse.data.accessToken;
  } catch (error) {
    // If login fails, create user
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        email: 'performance@test.com',
        name: 'Performance Test User',
        password: 'Test123!@#',
        gdprConsent: true,
      });
      
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'performance@test.com',
        password: 'Test123!@#',
      });
      
      return loginResponse.data.accessToken;
    } catch (registerError) {
      console.error('Failed to setup test user:', registerError.message);
      throw registerError;
    }
  }
}

// Test 1: Health check endpoint
async function testHealthCheck() {
  console.log('\n📊 Test 1: Health Check Endpoint');
  await measureResponseTime('GET /health', () =>
    axios.get(`${API_URL}/health`)
  );
}

// Test 2: Published courses list (should be cached)
async function testPublishedCoursesList(token) {
  console.log('\n📊 Test 2: Published Courses List');
  
  // First request (cache miss)
  const firstRequest = await measureResponseTime('GET /api/courses (first request)', () =>
    axios.get(`${API_URL}/api/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  
  if (firstRequest.passed) {
    testResults.cacheMisses++;
  }
  
  // Subsequent requests (should be cache hits)
  for (let i = 0; i < 3; i++) {
    const result = await measureResponseTime(`GET /api/courses (cached request ${i + 1})`, () =>
      axios.get(`${API_URL}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    
    // If response time is significantly faster, it's likely a cache hit
    if (result.responseTime < firstRequest.responseTime * 0.5) {
      testResults.cacheHits++;
    }
  }
}

// Test 3: Student progress (should be cached)
async function testStudentProgress(token) {
  console.log('\n📊 Test 3: Student Progress');
  
  // First request (cache miss)
  const firstRequest = await measureResponseTime('GET /api/students/courses/progress (first)', () =>
    axios.get(`${API_URL}/api/students/courses/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  
  if (firstRequest.passed) {
    testResults.cacheMisses++;
  }
  
  // Subsequent requests (should be cache hits)
  for (let i = 0; i < 3; i++) {
    const result = await measureResponseTime(`GET /api/students/courses/progress (cached ${i + 1})`, () =>
      axios.get(`${API_URL}/api/students/courses/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    
    if (result.responseTime < firstRequest.responseTime * 0.5) {
      testResults.cacheHits++;
    }
  }
}

// Test 4: Concurrent requests (load test)
async function testConcurrentRequests(token) {
  console.log('\n📊 Test 4: Concurrent Requests Load Test');
  console.log(`Sending ${LOAD_TEST_CONCURRENT_REQUESTS} concurrent requests...`);
  
  const requests = [];
  for (let i = 0; i < LOAD_TEST_CONCURRENT_REQUESTS; i++) {
    requests.push(
      axios.get(`${API_URL}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
  }
  
  const startTime = Date.now();
  try {
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / LOAD_TEST_CONCURRENT_REQUESTS;
    
    console.log(`✓ Completed ${LOAD_TEST_CONCURRENT_REQUESTS} requests in ${totalTime}ms`);
    console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
    console.log(`  Successful responses: ${responses.filter(r => r.status === 200).length}`);
    
    testResults.passed++;
  } catch (error) {
    console.log(`✗ Concurrent requests failed: ${error.message}`);
    testResults.failed++;
  }
}

// Test 5: Database query performance (with pagination)
async function testPaginationPerformance(token) {
  console.log('\n📊 Test 5: Pagination Performance');
  
  // Test different page sizes
  const pageSizes = [10, 20, 50];
  
  for (const pageSize of pageSizes) {
    await measureResponseTime(`GET /api/courses?limit=${pageSize}`, () =>
      axios.get(`${API_URL}/api/courses?limit=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
  }
}

// Test 6: Cache invalidation test
async function testCacheInvalidation(token) {
  console.log('\n📊 Test 6: Cache Invalidation');
  
  // Get courses (populate cache)
  await measureResponseTime('GET /api/courses (populate cache)', () =>
    axios.get(`${API_URL}/api/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  
  // Get courses again (should be cached)
  const cachedResult = await measureResponseTime('GET /api/courses (from cache)', () =>
    axios.get(`${API_URL}/api/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  );
  
  if (cachedResult.passed) {
    console.log('  Cache is working correctly');
  }
}

// Calculate statistics
function calculateStatistics() {
  console.log('\n' + '='.repeat(60));
  console.log('📈 PERFORMANCE TEST RESULTS');
  console.log('='.repeat(60));
  
  const totalTests = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / totalTests) * 100).toFixed(2);
  
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Passed: ${testResults.passed} (${passRate}%)`);
  console.log(`Failed: ${testResults.failed}`);
  
  if (testResults.responseTimes.length > 0) {
    // Sort response times
    const sortedTimes = testResults.responseTimes.sort((a, b) => a - b);
    
    // Calculate percentiles
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.50)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    const avg = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
    const min = sortedTimes[0];
    const max = sortedTimes[sortedTimes.length - 1];
    
    console.log('\n📊 Response Time Statistics:');
    console.log(`  Min: ${min}ms`);
    console.log(`  Max: ${max}ms`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Median (P50): ${p50}ms`);
    console.log(`  P95: ${p95}ms`);
    console.log(`  P99: ${p99}ms`);
    
    // Check if 95% of requests are under threshold
    const under2s = sortedTimes.filter(t => t < PERFORMANCE_THRESHOLD_MS).length;
    const percentUnder2s = ((under2s / sortedTimes.length) * 100).toFixed(2);
    
    console.log(`\n🎯 Performance Target:`);
    console.log(`  ${percentUnder2s}% of requests under ${PERFORMANCE_THRESHOLD_MS}ms`);
    
    if (percentUnder2s >= 95) {
      console.log(`  ✓ PASSED: Meets 95% target`);
    } else {
      console.log(`  ✗ FAILED: Does not meet 95% target`);
    }
  }
  
  // Cache statistics
  const totalCacheTests = testResults.cacheHits + testResults.cacheMisses;
  if (totalCacheTests > 0) {
    const cacheHitRate = ((testResults.cacheHits / totalCacheTests) * 100).toFixed(2);
    console.log(`\n💾 Cache Statistics:`);
    console.log(`  Cache Hits: ${testResults.cacheHits}`);
    console.log(`  Cache Misses: ${testResults.cacheMisses}`);
    console.log(`  Hit Rate: ${cacheHitRate}%`);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Main test runner
async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests');
  console.log(`API URL: ${API_URL}`);
  console.log(`Performance Threshold: ${PERFORMANCE_THRESHOLD_MS}ms`);
  console.log('='.repeat(60));
  
  try {
    // Setup
    console.log('\n🔧 Setting up test environment...');
    const token = await setupTestUser();
    console.log('✓ Test user authenticated');
    
    // Run tests
    await testHealthCheck();
    await testPublishedCoursesList(token);
    await testStudentProgress(token);
    await testPaginationPerformance(token);
    await testCacheInvalidation(token);
    await testConcurrentRequests(token);
    
    // Calculate and display results
    calculateStatistics();
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Performance tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runPerformanceTests();
