/**
 * Test script for Subscription Module
 * 
 * This script tests the core functionality of the subscription module:
 * - Creating subscriptions
 * - Viewing current subscription
 * - Cancelling subscriptions
 * - Reactivating subscriptions
 * - Admin endpoints for subscription management
 * 
 * Prerequisites:
 * - Server must be running (npm run dev)
 * - Database must be set up with migrations
 * - At least one student user and one plan must exist
 * 
 * Usage: node test-subscriptions.js
 */

const API_URL = 'http://localhost:3000/api';

// Test data - update these with actual values from your database
let studentToken = '';
let adminToken = '';
let planId = '';
let subscriptionId = '';

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  return { status: response.status, data };
}

// Test 1: Student login
async function testStudentLogin() {
  console.log('\n=== Test 1: Student Login ===');
  
  const { status, data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'student@test.com',
      password: 'password123',
    }),
  });

  if (status === 200 && data.accessToken) {
    studentToken = data.accessToken;
    console.log('✓ Student login successful');
    return true;
  } else {
    console.log('✗ Student login failed:', data);
    return false;
  }
}

// Test 2: Admin login
async function testAdminLogin() {
  console.log('\n=== Test 2: Admin Login ===');
  
  const { status, data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@test.com',
      password: 'admin123',
    }),
  });

  if (status === 200 && data.accessToken) {
    adminToken = data.accessToken;
    console.log('✓ Admin login successful');
    return true;
  } else {
    console.log('✗ Admin login failed:', data);
    return false;
  }
}

// Test 3: Get available plans
async function testGetPlans() {
  console.log('\n=== Test 3: Get Available Plans ===');
  
  const { status, data } = await apiRequest('/subscriptions/plans', {
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  });

  if (status === 200 && Array.isArray(data) && data.length > 0) {
    planId = data[0].id;
    console.log('✓ Plans retrieved successfully');
    console.log(`  Found ${data.length} plan(s)`);
    console.log(`  Using plan: ${data[0].name} (${data[0].price} ${data[0].currency})`);
    return true;
  } else {
    console.log('✗ Failed to get plans:', data);
    return false;
  }
}

// Test 4: Create subscription (checkout session)
async function testCreateSubscription() {
  console.log('\n=== Test 4: Create Subscription ===');
  
  const { status, data } = await apiRequest('/subscriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      planId: planId,
    }),
  });

  if (status === 201 && data.checkoutUrl) {
    console.log('✓ Subscription checkout created successfully');
    console.log(`  Checkout URL: ${data.checkoutUrl}`);
    console.log(`  Session ID: ${data.sessionId}`);
    return true;
  } else {
    console.log('✗ Failed to create subscription:', data);
    return false;
  }
}

// Test 5: Get current subscription
async function testGetCurrentSubscription() {
  console.log('\n=== Test 5: Get Current Subscription ===');
  
  const { status, data } = await apiRequest('/subscriptions/current', {
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  });

  if (status === 200 && data.id) {
    subscriptionId = data.id;
    console.log('✓ Current subscription retrieved successfully');
    console.log(`  Status: ${data.status}`);
    console.log(`  Plan: ${data.plan?.name}`);
    return true;
  } else if (status === 404) {
    console.log('ℹ No active subscription found (expected for new student)');
    return true;
  } else {
    console.log('✗ Failed to get current subscription:', data);
    return false;
  }
}

// Test 6: Admin - Get all subscriptions
async function testAdminGetSubscriptions() {
  console.log('\n=== Test 6: Admin - Get All Subscriptions ===');
  
  const { status, data } = await apiRequest('/admin/subscriptions?page=1&limit=10', {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (status === 200 && data.subscriptions) {
    console.log('✓ Subscriptions retrieved successfully');
    console.log(`  Total: ${data.total}`);
    console.log(`  Page: ${data.page}/${data.totalPages}`);
    return true;
  } else {
    console.log('✗ Failed to get subscriptions:', data);
    return false;
  }
}

// Test 7: Admin - Get subscription stats
async function testAdminGetStats() {
  console.log('\n=== Test 7: Admin - Get Subscription Stats ===');
  
  const { status, data } = await apiRequest('/admin/subscriptions/stats', {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (status === 200 && typeof data.totalActive === 'number') {
    console.log('✓ Subscription stats retrieved successfully');
    console.log(`  Total Active: ${data.totalActive}`);
    console.log(`  Total Suspended: ${data.totalSuspended}`);
    console.log(`  Total Cancelled: ${data.totalCancelled}`);
    console.log(`  MRR: ${data.monthlyRecurringRevenue}`);
    console.log(`  Churn Rate: ${data.churnRate}%`);
    return true;
  } else {
    console.log('✗ Failed to get subscription stats:', data);
    return false;
  }
}

// Test 8: Cancel subscription (if exists)
async function testCancelSubscription() {
  console.log('\n=== Test 8: Cancel Subscription ===');
  
  if (!subscriptionId) {
    console.log('ℹ Skipping - no active subscription to cancel');
    return true;
  }
  
  const { status, data } = await apiRequest('/subscriptions/cancel', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  });

  if (status === 200) {
    console.log('✓ Subscription cancelled successfully');
    console.log(`  Status: ${data.subscription?.status}`);
    return true;
  } else if (status === 404) {
    console.log('ℹ No active subscription to cancel');
    return true;
  } else {
    console.log('✗ Failed to cancel subscription:', data);
    return false;
  }
}

// Test 9: Reactivate subscription
async function testReactivateSubscription() {
  console.log('\n=== Test 9: Reactivate Subscription ===');
  
  const { status, data } = await apiRequest('/subscriptions/reactivate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  });

  if (status === 200) {
    console.log('✓ Subscription reactivated successfully');
    console.log(`  Status: ${data.subscription?.status}`);
    return true;
  } else if (status === 404) {
    console.log('ℹ No cancelled subscription to reactivate');
    return true;
  } else {
    console.log('✗ Failed to reactivate subscription:', data);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('========================================');
  console.log('  SUBSCRIPTION MODULE TESTS');
  console.log('========================================');

  const tests = [
    testStudentLogin,
    testAdminLogin,
    testGetPlans,
    testCreateSubscription,
    testGetCurrentSubscription,
    testAdminGetSubscriptions,
    testAdminGetStats,
    testCancelSubscription,
    testReactivateSubscription,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`✗ Test error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('  TEST SUMMARY');
  console.log('========================================');
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
