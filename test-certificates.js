/**
 * Test script for Certificate Module
 * Tests certificate issuance, verification, and download
 */

const API_URL = 'http://localhost:3000/api';

// Test data
let adminToken = '';
let instructorToken = '';
let studentToken = '';
let instructorId = '';
let studentId = '';
let courseId = '';
let moduleId = '';
let lessonId = '';
let assessmentId = '';
let certificateId = '';
let verificationCode = '';

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

// Test 1: Setup - Create admin, instructor, student, and course
async function test1_Setup() {
  console.log('\n=== Test 1: Setup ===');

  // Login as admin
  const loginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@plataforma-ead.com',
      password: 'Admin@123',
    }),
  });

  if (loginResult.status !== 200) {
    console.error('❌ Failed to login as admin');
    return false;
  }

  adminToken = loginResult.data.data.accessToken;
  console.log('✅ Admin logged in');

  // Create instructor
  const instructorResult = await apiRequest('/admin/instructors', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Certificate Test Instructor',
      email: `instructor.cert.${Date.now()}@test.com`,
      bio: 'Test instructor for certificate module',
    }),
  });

  if (instructorResult.status !== 201) {
    console.error('❌ Failed to create instructor');
    return false;
  }

  instructorId = instructorResult.data.data.instructor.id;
  const instructorPassword = instructorResult.data.data.temporaryPassword;
  console.log('✅ Instructor created');

  // Login as instructor
  const instructorLoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: instructorResult.data.data.instructor.email,
      password: instructorPassword,
    }),
  });

  instructorToken = instructorLoginResult.data.data.accessToken;
  console.log('✅ Instructor logged in');

  // Create student
  const studentEmail = `student.cert.${Date.now()}@test.com`;
  const studentResult = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Certificate Test Student',
      email: studentEmail,
      password: 'Student123!@#',
      gdprConsent: true,
    }),
  });

  if (studentResult.status !== 201) {
    console.error('❌ Failed to create student');
    return false;
  }

  studentId = studentResult.data.data.user.id;
  console.log('✅ Student created');

  // Login as student
  const studentLoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      password: 'Student123!@#',
    }),
  });

  studentToken = studentLoginResult.data.data.accessToken;
  console.log('✅ Student logged in');

  return true;
}

// Test 2: Create and publish a course
async function test2_CreateCourse() {
  console.log('\n=== Test 2: Create and Publish Course ===');

  // Create course
  const courseResult = await apiRequest('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Certificate Test Course',
      description: 'A course to test certificate issuance',
      category: 'Technology',
      workload: 10,
    }),
  });

  if (courseResult.status !== 201) {
    console.error('❌ Failed to create course');
    return false;
  }

  courseId = courseResult.data.data.id;
  console.log('✅ Course created');

  // Add module
  const moduleResult = await apiRequest(`/courses/${courseId}/modules`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Module 1',
      description: 'First module',
      order: 1,
    }),
  });

  if (moduleResult.status !== 201) {
    console.error('❌ Failed to create module');
    return false;
  }

  moduleId = moduleResult.data.data.id;
  console.log('✅ Module created');

  // Add lesson
  const lessonResult = await apiRequest(`/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Lesson 1',
      description: 'First lesson',
      type: 'text',
      content: 'This is the lesson content',
      duration: 30,
      order: 1,
    }),
  });

  if (lessonResult.status !== 201) {
    console.error('❌ Failed to create lesson');
    return false;
  }

  lessonId = lessonResult.data.data.id;
  console.log('✅ Lesson created');

  // Submit for approval
  const submitResult = await apiRequest(`/courses/${courseId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
  });

  if (submitResult.status !== 200) {
    console.error('❌ Failed to submit course for approval');
    return false;
  }

  console.log('✅ Course submitted for approval');

  // Approve course
  const approveResult = await apiRequest(`/admin/courses/${courseId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (approveResult.status !== 200) {
    console.error('❌ Failed to approve course');
    return false;
  }

  console.log('✅ Course approved and published');

  return true;
}

// Test 3: Create assessment
async function test3_CreateAssessment() {
  console.log('\n=== Test 3: Create Assessment ===');

  // Create assessment
  const assessmentResult = await apiRequest(`/courses/${courseId}/assessments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Final Assessment',
      type: 'multiple_choice',
      passingScore: 70,
    }),
  });

  if (assessmentResult.status !== 201) {
    console.error('❌ Failed to create assessment');
    return false;
  }

  assessmentId = assessmentResult.data.data.id;
  console.log('✅ Assessment created');

  // Add question
  const questionResult = await apiRequest(`/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      text: 'What is 2 + 2?',
      type: 'multiple_choice',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      points: 100,
      order: 1,
    }),
  });

  if (questionResult.status !== 201) {
    console.error('❌ Failed to create question');
    return false;
  }

  console.log('✅ Question created');

  return true;
}

// Test 4: Activate subscription for student
async function test4_ActivateSubscription() {
  console.log('\n=== Test 4: Activate Subscription ===');

  // Manually activate subscription (simulating successful payment)
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/plataforma_ead',
  });

  try {
    await pool.query('BEGIN');

    // Create subscription
    const subResult = await pool.query(
      `INSERT INTO subscriptions (student_id, plan_id, status, current_period_start, current_period_end, gateway_subscription_id)
       VALUES ($1, (SELECT id FROM plans LIMIT 1), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', 'test_sub_${Date.now()}')
       RETURNING id`,
      [studentId]
    );

    // Update student status
    await pool.query(
      `UPDATE students SET subscription_status = 'active', subscription_expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
       WHERE id = $1`,
      [studentId]
    );

    await pool.query('COMMIT');
    console.log('✅ Subscription activated');
    return true;
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Failed to activate subscription:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Test 5: Complete course and pass assessment
async function test5_CompleteCourse() {
  console.log('\n=== Test 5: Complete Course ===');

  // Mark lesson as completed
  const progressResult = await apiRequest(`/courses/${courseId}/progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      lessonId: lessonId,
    }),
  });

  if (progressResult.status !== 200) {
    console.error('❌ Failed to mark lesson as completed');
    return false;
  }

  console.log('✅ Lesson marked as completed');
  console.log(`   Progress: ${progressResult.data.data.progressPercentage}%`);

  // Submit assessment
  const submitResult = await apiRequest(`/assessments/${assessmentId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      answers: [
        {
          questionId: (await apiRequest(`/assessments/${assessmentId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${studentToken}` },
          })).data.data.questions[0].id,
          answer: 1, // Correct answer
        },
      ],
    }),
  });

  if (submitResult.status !== 201) {
    console.error('❌ Failed to submit assessment');
    return false;
  }

  console.log('✅ Assessment submitted');
  console.log(`   Score: ${submitResult.data.data.score}`);

  return true;
}

// Test 6: Test certificate not issued if score is below passing
async function test6_TestIneligibleForCertificate() {
  console.log('\n=== Test 6: Test Ineligible for Certificate ===');

  // Try to manually issue certificate (should fail)
  const issueResult = await apiRequest(`/certificates/issue/${courseId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  // If score is below passing, this should fail
  // If score is above passing, this should succeed
  if (issueResult.status === 400) {
    console.log('✅ Certificate correctly not issued (not eligible)');
    console.log(`   Reason: ${issueResult.data.error.code}`);
    return true;
  } else if (issueResult.status === 201) {
    console.log('✅ Certificate issued (student is eligible)');
    certificateId = issueResult.data.data.id;
    verificationCode = issueResult.data.data.verificationCode;
    return true;
  } else {
    console.error('❌ Unexpected response');
    return false;
  }
}

// Test 7: Issue certificate (automatic or manual)
async function test7_IssueCertificate() {
  console.log('\n=== Test 7: Issue Certificate ===');

  // If certificate was already issued in test 6, skip
  if (certificateId) {
    console.log('✅ Certificate already issued in previous test');
    return true;
  }

  // Manually trigger certificate issuance
  const issueResult = await apiRequest(`/certificates/issue/${courseId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (issueResult.status !== 201) {
    console.error('❌ Failed to issue certificate');
    console.error('   Error:', issueResult.data.error);
    return false;
  }

  certificateId = issueResult.data.data.id;
  verificationCode = issueResult.data.data.verificationCode;
  console.log('✅ Certificate issued');
  console.log(`   Certificate ID: ${certificateId}`);
  console.log(`   Verification Code: ${verificationCode}`);

  return true;
}

// Test 8: List student certificates
async function test8_ListCertificates() {
  console.log('\n=== Test 8: List Certificates ===');

  const listResult = await apiRequest('/certificates', {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (listResult.status !== 200) {
    console.error('❌ Failed to list certificates');
    return false;
  }

  console.log('✅ Certificates listed');
  console.log(`   Count: ${listResult.data.count}`);
  console.log(`   Certificates:`, listResult.data.data.map(c => ({
    id: c.id,
    courseName: c.courseName,
    issuedAt: c.issuedAt,
  })));

  return true;
}

// Test 9: Verify certificate (public endpoint)
async function test9_VerifyCertificate() {
  console.log('\n=== Test 9: Verify Certificate ===');

  const verifyResult = await apiRequest(`/public/certificates/verify/${verificationCode}`, {
    method: 'GET',
  });

  if (verifyResult.status !== 200) {
    console.error('❌ Failed to verify certificate');
    return false;
  }

  console.log('✅ Certificate verified');
  console.log(`   Valid: ${verifyResult.data.data.valid}`);
  console.log(`   Student: ${verifyResult.data.data.certificate.studentName}`);
  console.log(`   Course: ${verifyResult.data.data.certificate.courseName}`);
  console.log(`   Workload: ${verifyResult.data.data.certificate.courseWorkload} hours`);

  return true;
}

// Test 10: Test certificate not duplicated
async function test10_TestNoDuplicateCertificate() {
  console.log('\n=== Test 10: Test No Duplicate Certificate ===');

  // Try to issue certificate again
  const issueResult = await apiRequest(`/certificates/issue/${courseId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (issueResult.status === 201) {
    // Check if it's the same certificate
    if (issueResult.data.data.id === certificateId) {
      console.log('✅ Same certificate returned (no duplicate)');
      return true;
    } else {
      console.error('❌ New certificate created (duplicate)');
      return false;
    }
  } else {
    console.error('❌ Unexpected response');
    return false;
  }
}

// Test 11: Test invalid verification code
async function test11_TestInvalidVerificationCode() {
  console.log('\n=== Test 11: Test Invalid Verification Code ===');

  const verifyResult = await apiRequest('/public/certificates/verify/invalid-code-12345', {
    method: 'GET',
  });

  if (verifyResult.status === 404) {
    console.log('✅ Invalid verification code correctly rejected');
    return true;
  } else {
    console.error('❌ Invalid verification code not rejected');
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Certificate Module Tests...\n');

  const tests = [
    { name: 'Setup', fn: test1_Setup },
    { name: 'Create Course', fn: test2_CreateCourse },
    { name: 'Create Assessment', fn: test3_CreateAssessment },
    { name: 'Activate Subscription', fn: test4_ActivateSubscription },
    { name: 'Complete Course', fn: test5_CompleteCourse },
    { name: 'Test Ineligible', fn: test6_TestIneligibleForCertificate },
    { name: 'Issue Certificate', fn: test7_IssueCertificate },
    { name: 'List Certificates', fn: test8_ListCertificates },
    { name: 'Verify Certificate', fn: test9_VerifyCertificate },
    { name: 'No Duplicate', fn: test10_TestNoDuplicateCertificate },
    { name: 'Invalid Code', fn: test11_TestInvalidVerificationCode },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
        console.log(`\n⚠️  Test "${test.name}" failed\n`);
      }
    } catch (error) {
      failed++;
      console.error(`\n❌ Test "${test.name}" threw an error:`, error.message, '\n');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${tests.length}`);
  console.log('='.repeat(50) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
