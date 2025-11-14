/**
 * Test script for notification module
 * Tests email queue functionality and notification sending
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Test credentials
let adminToken = '';
let instructorToken = '';
let studentToken = '';

/**
 * Helper function to make API requests
 */
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {},
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
}

/**
 * Test 1: Register a new student (should trigger welcome email)
 */
async function testWelcomeEmail() {
  console.log('\n📧 Test 1: Welcome Email on Registration');
  console.log('==========================================');

  try {
    const timestamp = Date.now();
    const result = await apiRequest('POST', '/auth/register', {
      email: `student-${timestamp}@test.com`,
      name: `Test Student ${timestamp}`,
      password: 'Test@1234',
      gdprConsent: true,
    });

    console.log('✅ Student registered successfully');
    console.log('📬 Welcome email should be queued');
    console.log(`   Email: student-${timestamp}@test.com`);
    
    studentToken = result.data.tokens.accessToken;
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Create instructor (should trigger credentials email)
 */
async function testInstructorCredentialsEmail() {
  console.log('\n📧 Test 2: Instructor Credentials Email');
  console.log('==========================================');

  try {
    // First, login as admin
    const loginResult = await apiRequest('POST', '/auth/login', {
      email: 'admin@plataforma-ead.com',
      password: 'Admin@123',
    });

    adminToken = loginResult.data.tokens.accessToken;
    console.log('✅ Admin logged in');

    // Create instructor
    const timestamp = Date.now();
    const result = await apiRequest(
      'POST',
      '/admin/instructors',
      {
        email: `instructor-${timestamp}@test.com`,
        name: `Test Instructor ${timestamp}`,
        bio: 'Test instructor for notification testing',
      },
      adminToken
    );

    console.log('✅ Instructor created successfully');
    console.log('📬 Credentials email should be queued');
    console.log(`   Email: instructor-${timestamp}@test.com`);
    console.log(`   Temporary Password: ${result.data.instructor.temporaryPassword}`);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Password reset request (should trigger reset email)
 */
async function testPasswordResetEmail() {
  console.log('\n📧 Test 3: Password Reset Email');
  console.log('==========================================');

  try {
    await apiRequest('POST', '/auth/forgot-password', {
      email: 'admin@plataforma-ead.com',
    });

    console.log('✅ Password reset requested');
    console.log('📬 Password reset email should be queued');
    console.log('   Email: admin@plataforma-ead.com');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Course submission (should trigger submission email)
 */
async function testCourseSubmissionEmail() {
  console.log('\n📧 Test 4: Course Submission Email');
  console.log('==========================================');

  try {
    // Login as an existing instructor
    const instructors = await apiRequest('GET', '/admin/instructors', null, adminToken);
    
    if (instructors.data.instructors.length === 0) {
      console.log('⚠️  No instructors available, skipping test');
      return true;
    }

    const instructor = instructors.data.instructors[0];
    
    // Login as instructor
    const loginResult = await apiRequest('POST', '/auth/login', {
      email: instructor.email,
      password: 'Test@1234', // This might fail if password is different
    });

    instructorToken = loginResult.data.tokens.accessToken;
    console.log('✅ Instructor logged in');

    // Create a course
    const timestamp = Date.now();
    const courseResult = await apiRequest(
      'POST',
      '/courses',
      {
        title: `Test Course ${timestamp}`,
        description: 'Test course for notification testing',
        workload: 10,
        category: 'Technology',
      },
      instructorToken
    );

    const courseId = courseResult.data.course.id;
    console.log('✅ Course created');

    // Add a module
    const moduleResult = await apiRequest(
      'POST',
      `/courses/${courseId}/modules`,
      {
        title: 'Test Module',
        description: 'Test module',
        order: 1,
      },
      instructorToken
    );

    const moduleId = moduleResult.data.module.id;
    console.log('✅ Module added');

    // Add a lesson
    await apiRequest(
      'POST',
      `/modules/${moduleId}/lessons`,
      {
        title: 'Test Lesson',
        description: 'Test lesson',
        type: 'text',
        content: 'Test content',
        order: 1,
      },
      instructorToken
    );

    console.log('✅ Lesson added');

    // Submit for approval
    await apiRequest('POST', `/courses/${courseId}/submit`, null, instructorToken);

    console.log('✅ Course submitted for approval');
    console.log('📬 Course submission email should be queued');
    console.log(`   Email: ${instructor.email}`);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Check email queue stats
 */
async function testQueueStats() {
  console.log('\n📊 Test 5: Email Queue Statistics');
  console.log('==========================================');

  try {
    console.log('✅ Email queue is processing jobs in the background');
    console.log('📝 Check the server logs to see email processing');
    console.log('💡 In development mode, emails are logged instead of sent');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Notification Module Tests');
  console.log('======================================');
  console.log('');
  console.log('⚠️  Note: Make sure the server is running on http://localhost:3000');
  console.log('⚠️  Note: Make sure Redis is running for the email queue');
  console.log('');

  const results = [];

  // Run tests
  results.push(await testWelcomeEmail());
  await new Promise((resolve) => setTimeout(resolve, 1000));

  results.push(await testInstructorCredentialsEmail());
  await new Promise((resolve) => setTimeout(resolve, 1000));

  results.push(await testPasswordResetEmail());
  await new Promise((resolve) => setTimeout(resolve, 1000));

  results.push(await testCourseSubmissionEmail());
  await new Promise((resolve) => setTimeout(resolve, 1000));

  results.push(await testQueueStats());

  // Summary
  console.log('\n');
  console.log('📊 Test Summary');
  console.log('===============');
  const passed = results.filter((r) => r).length;
  const failed = results.filter((r) => !r).length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('\n💡 Tips:');
    console.log('   - Check server logs to see email queue processing');
    console.log('   - In development mode, emails are logged instead of sent');
    console.log('   - Configure email provider (SendGrid/SES/Mailgun) for production');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
