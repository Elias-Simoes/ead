/**
 * Test script for Progress Module
 * Tests course access, progress tracking, and student history
 */

const API_URL = 'http://localhost:3000/api';

// Test data
let adminToken = '';
let instructorToken = '';
let studentToken = '';
let studentWithoutSubToken = '';
let instructorId = '';
let studentId = '';
let studentWithoutSubId = '';
let courseId = '';
let moduleId = '';
let lesson1Id = '';
let lesson2Id = '';
let lesson3Id = '';

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

// Test 1: Setup - Create admin, instructor, and students
async function test1_Setup() {
  console.log('\n=== Test 1: Setup ===');

  // Login as admin (assuming admin exists from previous tests)
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
      name: 'Progress Test Instructor',
      email: `instructor.progress.${Date.now()}@test.com`,
      bio: 'Test instructor for progress module',
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

  // Create student with subscription
  const studentEmail = `student.progress.${Date.now()}@test.com`;
  const studentResult = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Progress Test Student',
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
  studentToken = studentResult.data.data.accessToken;
  console.log('✅ Student created');

  // Create student without subscription
  const studentNoSubEmail = `student.nosub.${Date.now()}@test.com`;
  const studentNoSubResult = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Student Without Subscription',
      email: studentNoSubEmail,
      password: 'Student123!@#',
      gdprConsent: true,
    }),
  });

  studentWithoutSubId = studentNoSubResult.data.data.user.id;
  studentWithoutSubToken = studentNoSubResult.data.data.accessToken;
  console.log('✅ Student without subscription created');

  // Activate subscription for first student (directly in DB for testing)
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  await pool.query(
    `UPDATE students 
     SET subscription_status = 'active', 
         subscription_expires_at = NOW() + INTERVAL '30 days'
     WHERE id = $1`,
    [studentId]
  );
  
  await pool.end();
  console.log('✅ Student subscription activated');

  return true;
}

// Test 2: Create a published course with modules and lessons
async function test2_CreateCourse() {
  console.log('\n=== Test 2: Create Course ===');

  // Create course
  const courseResult = await apiRequest('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Progress Test Course',
      description: 'A course to test progress tracking',
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

  // Create module
  const moduleResult = await apiRequest(`/courses/${courseId}/modules`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Module 1',
      description: 'First module',
      orderIndex: 1,
    }),
  });

  moduleId = moduleResult.data.data.id;
  console.log('✅ Module created');

  // Create 3 lessons
  const lesson1Result = await apiRequest(`/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Lesson 1',
      description: 'First lesson',
      type: 'text',
      content: 'This is lesson 1 content',
      orderIndex: 1,
    }),
  });

  lesson1Id = lesson1Result.data.data.id;
  console.log('✅ Lesson 1 created');

  const lesson2Result = await apiRequest(`/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Lesson 2',
      description: 'Second lesson',
      type: 'text',
      content: 'This is lesson 2 content',
      orderIndex: 2,
    }),
  });

  lesson2Id = lesson2Result.data.data.id;
  console.log('✅ Lesson 2 created');

  const lesson3Result = await apiRequest(`/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
    body: JSON.stringify({
      title: 'Lesson 3',
      description: 'Third lesson',
      type: 'text',
      content: 'This is lesson 3 content',
      orderIndex: 3,
    }),
  });

  lesson3Id = lesson3Result.data.data.id;
  console.log('✅ Lesson 3 created');

  // Submit for approval
  await apiRequest(`/courses/${courseId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructorToken}` },
  });

  // Approve course
  await apiRequest(`/admin/courses/${courseId}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  console.log('✅ Course published');

  return true;
}

// Test 3: Test access denied without active subscription
async function test3_AccessDeniedWithoutSubscription() {
  console.log('\n=== Test 3: Access Denied Without Subscription ===');

  const result = await apiRequest(`/courses/${courseId}/content`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentWithoutSubToken}` },
  });

  if (result.status === 403 && result.data.error.code === 'SUBSCRIPTION_REQUIRED') {
    console.log('✅ Access correctly denied for student without subscription');
    return true;
  }

  console.error('❌ Expected 403 SUBSCRIPTION_REQUIRED, got:', result.status);
  return false;
}

// Test 4: Test course content access with active subscription
async function test4_AccessCourseContent() {
  console.log('\n=== Test 4: Access Course Content ===');

  const result = await apiRequest(`/courses/${courseId}/content`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (result.status !== 200) {
    console.error('❌ Failed to access course content');
    return false;
  }

  const course = result.data.data;
  
  if (course.title !== 'Progress Test Course') {
    console.error('❌ Wrong course title');
    return false;
  }

  if (course.modules.length !== 1) {
    console.error('❌ Expected 1 module');
    return false;
  }

  if (course.modules[0].lessons.length !== 3) {
    console.error('❌ Expected 3 lessons');
    return false;
  }

  if (course.totalLessons !== 3) {
    console.error('❌ Expected totalLessons to be 3');
    return false;
  }

  console.log('✅ Course content accessed successfully');
  console.log(`   - Course: ${course.title}`);
  console.log(`   - Modules: ${course.modules.length}`);
  console.log(`   - Total Lessons: ${course.totalLessons}`);

  return true;
}

// Test 5: Test lesson content access
async function test5_AccessLessonContent() {
  console.log('\n=== Test 5: Access Lesson Content ===');

  const result = await apiRequest(`/lessons/${lesson1Id}/content`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (result.status !== 200) {
    console.error('❌ Failed to access lesson content');
    return false;
  }

  const lesson = result.data.data;
  
  if (lesson.title !== 'Lesson 1') {
    console.error('❌ Wrong lesson title');
    return false;
  }

  if (lesson.content !== 'This is lesson 1 content') {
    console.error('❌ Wrong lesson content');
    return false;
  }

  console.log('✅ Lesson content accessed successfully');
  console.log(`   - Lesson: ${lesson.title}`);
  console.log(`   - Type: ${lesson.type}`);

  return true;
}

// Test 6: Test marking lesson as completed
async function test6_MarkLessonCompleted() {
  console.log('\n=== Test 6: Mark Lesson as Completed ===');

  // Mark lesson 1 as completed
  const result1 = await apiRequest(`/courses/${courseId}/progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ lessonId: lesson1Id }),
  });

  if (result1.status !== 200) {
    console.error('❌ Failed to mark lesson 1 as completed');
    return false;
  }

  const progress1 = result1.data.data;
  
  if (Math.abs(progress1.progressPercentage - 33.33) > 0.1) {
    console.error('❌ Expected progress ~33.33%, got:', progress1.progressPercentage);
    return false;
  }

  if (progress1.completedLessonsCount !== 1) {
    console.error('❌ Expected 1 completed lesson');
    return false;
  }

  console.log('✅ Lesson 1 marked as completed');
  console.log(`   - Progress: ${progress1.progressPercentage}%`);

  // Mark lesson 2 as completed
  const result2 = await apiRequest(`/courses/${courseId}/progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ lessonId: lesson2Id }),
  });

  const progress2 = result2.data.data;
  
  if (Math.abs(progress2.progressPercentage - 66.67) > 0.1) {
    console.error('❌ Expected progress ~66.67%, got:', progress2.progressPercentage);
    return false;
  }

  console.log('✅ Lesson 2 marked as completed');
  console.log(`   - Progress: ${progress2.progressPercentage}%`);

  // Mark lesson 3 as completed
  const result3 = await apiRequest(`/courses/${courseId}/progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ lessonId: lesson3Id }),
  });

  const progress3 = result3.data.data;
  
  if (progress3.progressPercentage !== 100) {
    console.error('❌ Expected progress 100%, got:', progress3.progressPercentage);
    return false;
  }

  if (!progress3.isCompleted) {
    console.error('❌ Expected isCompleted to be true');
    return false;
  }

  console.log('✅ Lesson 3 marked as completed');
  console.log(`   - Progress: ${progress3.progressPercentage}%`);
  console.log(`   - Course completed: ${progress3.isCompleted}`);

  return true;
}

// Test 7: Test getting student progress
async function test7_GetStudentProgress() {
  console.log('\n=== Test 7: Get Student Progress ===');

  const result = await apiRequest('/students/courses/progress', {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (result.status !== 200) {
    console.error('❌ Failed to get student progress');
    return false;
  }

  const progress = result.data.data;
  
  if (progress.length !== 1) {
    console.error('❌ Expected 1 course in progress');
    return false;
  }

  const courseProgress = progress[0];
  
  if (courseProgress.progressPercentage !== 100) {
    console.error('❌ Expected 100% progress');
    return false;
  }

  if (courseProgress.completedLessonsCount !== 3) {
    console.error('❌ Expected 3 completed lessons');
    return false;
  }

  console.log('✅ Student progress retrieved successfully');
  console.log(`   - Courses: ${progress.length}`);
  console.log(`   - Progress: ${courseProgress.progressPercentage}%`);
  console.log(`   - Completed Lessons: ${courseProgress.completedLessonsCount}/${courseProgress.totalLessons}`);

  return true;
}

// Test 8: Test toggling favorite status
async function test8_ToggleFavorite() {
  console.log('\n=== Test 8: Toggle Favorite Status ===');

  // Add to favorites
  const result1 = await apiRequest(`/courses/${courseId}/favorite`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (result1.status !== 200) {
    console.error('❌ Failed to add to favorites');
    return false;
  }

  if (!result1.data.data.isFavorite) {
    console.error('❌ Expected isFavorite to be true');
    return false;
  }

  console.log('✅ Course added to favorites');

  // Remove from favorites
  const result2 = await apiRequest(`/courses/${courseId}/favorite`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (!result2.data.data.isFavorite === true) {
    console.error('❌ Expected isFavorite to be false');
    return false;
  }

  console.log('✅ Course removed from favorites');

  // Add back to favorites for next test
  await apiRequest(`/courses/${courseId}/favorite`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  return true;
}

// Test 9: Test getting student history
async function test9_GetStudentHistory() {
  console.log('\n=== Test 9: Get Student History ===');

  const result = await apiRequest('/students/courses/history', {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (result.status !== 200) {
    console.error('❌ Failed to get student history');
    return false;
  }

  const history = result.data.data;
  const summary = result.data.summary;
  
  if (history.completed.length !== 1) {
    console.error('❌ Expected 1 completed course');
    return false;
  }

  if (summary.completed !== 1) {
    console.error('❌ Expected summary.completed to be 1');
    return false;
  }

  if (summary.total !== 1) {
    console.error('❌ Expected summary.total to be 1');
    return false;
  }

  console.log('✅ Student history retrieved successfully');
  console.log(`   - Started: ${summary.started}`);
  console.log(`   - In Progress: ${summary.inProgress}`);
  console.log(`   - Completed: ${summary.completed}`);
  console.log(`   - Total: ${summary.total}`);

  return true;
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Progress Module Tests...\n');

  const tests = [
    { name: 'Setup', fn: test1_Setup },
    { name: 'Create Course', fn: test2_CreateCourse },
    { name: 'Access Denied Without Subscription', fn: test3_AccessDeniedWithoutSubscription },
    { name: 'Access Course Content', fn: test4_AccessCourseContent },
    { name: 'Access Lesson Content', fn: test5_AccessLessonContent },
    { name: 'Mark Lesson Completed', fn: test6_MarkLessonCompleted },
    { name: 'Get Student Progress', fn: test7_GetStudentProgress },
    { name: 'Toggle Favorite', fn: test8_ToggleFavorite },
    { name: 'Get Student History', fn: test9_GetStudentHistory },
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
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Total: ${tests.length}`);
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
