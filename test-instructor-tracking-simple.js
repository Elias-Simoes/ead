/**
 * Simplified test for Instructor Tracking Module
 * Tests basic functionality with existing data
 */

const API_URL = 'http://localhost:3000/api';

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

async function runSimpleTest() {
  console.log('=== Simple Instructor Tracking Test ===\n');

  // Step 1: Check if admin exists, if not create one
  console.log('Step 1: Checking admin...');
  let adminToken = '';
  
  const adminLoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@plataforma-ead.com',
      password: 'Admin@123',
    }),
  });

  if (adminLoginResult.status === 200) {
    adminToken = adminLoginResult.data.data.tokens.accessToken;
    console.log('✅ Admin logged in successfully');
  } else {
    console.log('❌ Admin login failed. Please run: node scripts/create-admin.js');
    console.log('Response:', adminLoginResult.data);
    return;
  }

  // Step 2: Create a test instructor
  console.log('\nStep 2: Creating test instructor...');
  const instructorEmail = `instructor.test.${Date.now()}@test.com`;
  
  const instructorResult = await apiRequest('/admin/instructors', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Test Instructor',
      email: instructorEmail,
      bio: 'Test instructor for tracking module',
    }),
  });

  if (instructorResult.status !== 201) {
    console.log('❌ Failed to create instructor');
    console.log('Status:', instructorResult.status);
    console.log('Response:', instructorResult.data);
    return;
  }

  const instructorId = instructorResult.data.data.instructor.id;
  const instructorPassword = instructorResult.data.data.temporaryPassword;
  console.log('✅ Instructor created:', instructorEmail);

  // Step 3: Login as instructor
  console.log('\nStep 3: Logging in as instructor...');
  const instructorLoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: instructorEmail,
      password: instructorPassword,
    }),
  });

  if (instructorLoginResult.status !== 200) {
    console.log('❌ Instructor login failed');
    console.log('Response:', instructorLoginResult.data);
    return;
  }

  const instructorToken = instructorLoginResult.data.data.tokens.accessToken;
  console.log('✅ Instructor logged in successfully');

  // Step 4: Test dashboard endpoint
  console.log('\nStep 4: Testing dashboard endpoint...');
  const dashboardResult = await apiRequest('/instructor/dashboard', {
    method: 'GET',
    headers: { Authorization: `Bearer ${instructorToken}` },
  });

  if (dashboardResult.status !== 200) {
    console.log('❌ Dashboard request failed');
    console.log('Response:', dashboardResult.data);
    return;
  }

  console.log('✅ Dashboard retrieved successfully');
  console.log('Dashboard data:', JSON.stringify(dashboardResult.data.data, null, 2));

  // Step 5: Create a course
  console.log('\nStep 5: Creating a test course...');
  const courseResult = await apiRequest('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Test Course for Tracking',
      description: 'A test course',
      category: 'Technology',
      workload: 10,
    }),
  });

  if (courseResult.status !== 201) {
    console.log('❌ Failed to create course');
    console.log('Response:', courseResult.data);
    return;
  }

  const courseId = courseResult.data.data.course.id;
  console.log('✅ Course created:', courseId);

  // Step 6: Test enrolled students endpoint (should be empty)
  console.log('\nStep 6: Testing enrolled students endpoint...');
  const studentsResult = await apiRequest(`/instructor/courses/${courseId}/students`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${instructorToken}` },
  });

  if (studentsResult.status !== 200) {
    console.log('❌ Failed to get enrolled students');
    console.log('Response:', studentsResult.data);
    return;
  }

  console.log('✅ Enrolled students retrieved successfully');
  console.log('Students data:', JSON.stringify(studentsResult.data.data, null, 2));

  console.log('\n=== All tests passed! ===');
}

runSimpleTest().catch(console.error);
