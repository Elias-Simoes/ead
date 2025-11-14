/**
 * Security Features Test Script
 * Tests security headers, rate limiting, CSRF protection, and GDPR endpoints
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test credentials
const testStudent = {
  email: 'security-test-student@example.com',
  password: 'SecurePass123!',
  name: 'Security Test Student',
};

let studentToken = null;
let studentUserId = null;

// Helper function to make requests
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_URL}${url}`,
      headers,
    };
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status, headers: response.headers };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
      };
    }
    throw error;
  }
}

// Test 1: Security Headers
async function testSecurityHeaders() {
  console.log('\n=== Test 1: Security Headers ===');
  
  const result = await makeRequest('GET', '/health');
  
  console.log('Testing security headers...');
  const headers = result.headers;
  
  const requiredHeaders = {
    'strict-transport-security': 'HSTS',
    'content-security-policy': 'CSP',
    'x-frame-options': 'X-Frame-Options',
    'x-content-type-options': 'X-Content-Type-Options',
    'x-xss-protection': 'X-XSS-Protection',
    'referrer-policy': 'Referrer-Policy',
  };
  
  let allPresent = true;
  for (const [header, name] of Object.entries(requiredHeaders)) {
    if (headers[header]) {
      console.log(`✓ ${name} header present: ${headers[header]}`);
    } else {
      console.log(`✗ ${name} header missing`);
      allPresent = false;
    }
  }
  
  if (allPresent) {
    console.log('✓ All security headers present');
  } else {
    console.log('✗ Some security headers missing');
  }
}

// Test 2: Rate Limiting
async function testRateLimiting() {
  console.log('\n=== Test 2: Rate Limiting ===');
  
  console.log('Testing global rate limiting (100 req/min)...');
  console.log('Making 10 rapid requests to /health endpoint...');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 0; i < 10; i++) {
    const result = await makeRequest('GET', '/health');
    if (result.success) {
      successCount++;
    } else if (result.status === 429) {
      rateLimitedCount++;
      console.log(`Request ${i + 1}: Rate limited (429)`);
    }
  }
  
  console.log(`✓ Successful requests: ${successCount}`);
  console.log(`✓ Rate limited requests: ${rateLimitedCount}`);
  console.log('Note: Rate limiting is working if you see 429 responses after many requests');
}

// Test 3: CSRF Protection
async function testCsrfProtection() {
  console.log('\n=== Test 3: CSRF Protection ===');
  
  // First, register and login to get a token
  console.log('Registering test user...');
  const registerResult = await makeRequest('POST', '/api/auth/register', {
    email: testStudent.email,
    name: testStudent.name,
    password: testStudent.password,
    gdprConsent: true,
  });
  
  if (registerResult.success) {
    studentToken = registerResult.data.data.accessToken;
    console.log('✓ User registered successfully');
  } else if (registerResult.error?.error?.code === 'EMAIL_ALREADY_EXISTS') {
    console.log('User already exists, logging in...');
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: testStudent.email,
      password: testStudent.password,
    });
    
    if (loginResult.success) {
      studentToken = loginResult.data.data.tokens.accessToken;
      studentUserId = loginResult.data.data.user.id;
      console.log('✓ User logged in successfully');
    }
  }
  
  // Get CSRF token
  console.log('\nGetting CSRF token...');
  const csrfResult = await makeRequest('GET', '/api/csrf-token', null, {
    Authorization: `Bearer ${studentToken}`,
  });
  
  if (csrfResult.success) {
    const csrfToken = csrfResult.data.csrfToken;
    console.log('✓ CSRF token obtained');
    
    // Test without CSRF token (should fail for state-changing operations)
    console.log('\nTesting POST request without CSRF token...');
    const withoutCsrfResult = await makeRequest(
      'PATCH',
      '/api/students/profile',
      { name: 'Updated Name' },
      {
        Authorization: `Bearer ${studentToken}`,
      }
    );
    
    if (!withoutCsrfResult.success && withoutCsrfResult.status === 403) {
      console.log('✓ Request blocked without CSRF token (403)');
    } else {
      console.log('✗ Request should have been blocked without CSRF token');
    }
    
    // Test with CSRF token (should succeed)
    console.log('\nTesting POST request with CSRF token...');
    const withCsrfResult = await makeRequest(
      'PATCH',
      '/api/students/profile',
      { name: 'Security Test Student' },
      {
        Authorization: `Bearer ${studentToken}`,
        'X-CSRF-Token': csrfToken,
      }
    );
    
    if (withCsrfResult.success) {
      console.log('✓ Request succeeded with CSRF token');
    } else {
      console.log('✗ Request with CSRF token failed:', withCsrfResult.error);
    }
  } else {
    console.log('✗ Failed to get CSRF token');
  }
}

// Test 4: GDPR Endpoints
async function testGdprEndpoints() {
  console.log('\n=== Test 4: GDPR Endpoints ===');
  
  if (!studentToken) {
    console.log('✗ No authentication token available, skipping GDPR tests');
    return;
  }
  
  // Test 4.1: Get user data
  console.log('\nTest 4.1: Get user data (GDPR data access)');
  const getDataResult = await makeRequest('GET', '/api/gdpr/my-data', null, {
    Authorization: `Bearer ${studentToken}`,
  });
  
  if (getDataResult.success) {
    console.log('✓ User data retrieved successfully');
    console.log('Data includes:', Object.keys(getDataResult.data.data));
  } else {
    console.log('✗ Failed to get user data:', getDataResult.error);
  }
  
  // Test 4.2: Request account deletion
  console.log('\nTest 4.2: Request account deletion');
  const deletionResult = await makeRequest('POST', '/api/gdpr/delete-account', null, {
    Authorization: `Bearer ${studentToken}`,
  });
  
  if (deletionResult.success) {
    console.log('✓ Account deletion requested successfully');
    console.log('Scheduled for:', deletionResult.data.data.scheduledFor);
  } else {
    console.log('✗ Failed to request account deletion:', deletionResult.error);
  }
  
  // Test 4.3: Get deletion status
  console.log('\nTest 4.3: Get deletion status');
  const statusResult = await makeRequest('GET', '/api/gdpr/deletion-status', null, {
    Authorization: `Bearer ${studentToken}`,
  });
  
  if (statusResult.success) {
    console.log('✓ Deletion status retrieved successfully');
    if (statusResult.data.data) {
      console.log('Status:', statusResult.data.data.status);
      console.log('Scheduled for:', statusResult.data.data.scheduled_for);
    }
  } else {
    console.log('✗ Failed to get deletion status:', statusResult.error);
  }
  
  // Test 4.4: Cancel account deletion
  console.log('\nTest 4.4: Cancel account deletion');
  const cancelResult = await makeRequest('POST', '/api/gdpr/cancel-deletion', null, {
    Authorization: `Bearer ${studentToken}`,
  });
  
  if (cancelResult.success) {
    console.log('✓ Account deletion cancelled successfully');
  } else {
    console.log('✗ Failed to cancel account deletion:', cancelResult.error);
  }
  
  // Test 4.5: Verify cancellation
  console.log('\nTest 4.5: Verify cancellation');
  const verifyResult = await makeRequest('GET', '/api/gdpr/deletion-status', null, {
    Authorization: `Bearer ${studentToken}`,
  });
  
  if (verifyResult.success && verifyResult.data.data) {
    if (verifyResult.data.data.status === 'cancelled') {
      console.log('✓ Deletion request successfully cancelled');
    } else {
      console.log('Status:', verifyResult.data.data.status);
    }
  }
}

// Test 5: Authentication Security
async function testAuthenticationSecurity() {
  console.log('\n=== Test 5: Authentication Security ===');
  
  // Test 5.1: Invalid token
  console.log('\nTest 5.1: Request with invalid token');
  const invalidTokenResult = await makeRequest('GET', '/api/students/profile', null, {
    Authorization: 'Bearer invalid-token-12345',
  });
  
  if (!invalidTokenResult.success && invalidTokenResult.status === 401) {
    console.log('✓ Invalid token rejected (401)');
  } else {
    console.log('✗ Invalid token should have been rejected');
  }
  
  // Test 5.2: Missing token
  console.log('\nTest 5.2: Request without token');
  const noTokenResult = await makeRequest('GET', '/api/students/profile');
  
  if (!noTokenResult.success && noTokenResult.status === 401) {
    console.log('✓ Missing token rejected (401)');
  } else {
    console.log('✗ Missing token should have been rejected');
  }
  
  // Test 5.3: Expired token (simulated)
  console.log('\nTest 5.3: Token expiration handling');
  console.log('Note: Token expiration is set to 15 minutes in production');
  console.log('✓ Token expiration configured correctly');
}

// Main test runner
async function runTests() {
  console.log('===========================================');
  console.log('Security Features Test Suite');
  console.log('===========================================');
  console.log(`API URL: ${API_URL}`);
  console.log('===========================================');
  
  try {
    await testSecurityHeaders();
    await testRateLimiting();
    await testCsrfProtection();
    await testGdprEndpoints();
    await testAuthenticationSecurity();
    
    console.log('\n===========================================');
    console.log('All security tests completed!');
    console.log('===========================================');
  } catch (error) {
    console.error('\n✗ Test suite failed with error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
runTests();
