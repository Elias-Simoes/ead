/**
 * Test script for Instructor Tracking Module
 * Tests instructor dashboard and student progress viewing
 */

const API_URL = 'http://localhost:3000/api';

// Test data
let adminToken = '';
let instructor1Token = '';
let instructor2Token = '';
let student1Token = '';
let student2Token = '';
let instructor1Id = '';
let instructor2Id = '';
let student1Id = '';
let student2Id = '';
let course1Id = '';
let course2Id = '';
let moduleId = '';
let lesson1Id = '';
let lesson2Id = '';

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

// Test 1: Setup - Create instructors, students, and courses
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

  adminToken = loginResult.data.data.tokens.accessToken;
  console.log('✅ Admin logged in');

  // Create instructor 1
  const instructor1Result = await apiRequest('/admin/instructors', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Instructor Tracking Test 1',
      email: `instructor.tracking1.${Date.now()}@test.com`,
      bio: 'Test instructor 1',
    }),
  });

  if (instructor1Result.status !== 201) {
    console.error('❌ Failed to create instructor 1');
    console.error('Status:', instructor1Result.status);
    console.error('Response:', instructor1Result.data);
    return false;
  }

  instructor1Id = instructor1Result.data.data.instructor.id;
  const instructor1Password = instructor1Result.data.data.temporaryPassword;
  console.log('✅ Instructor 1 created');

  // Login as instructor 1
  const instructor1LoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: instructor1Result.data.data.instructor.email,
      password: instructor1Password,
    }),
  });

  if (instructor1LoginResult.status !== 200) {
    console.error('❌ Instructor 1 login failed');
    console.error('Response:', instructor1LoginResult.data);
    return false;
  }

  instructor1Token = instructor1LoginResult.data.data.tokens.accessToken;
  console.log('✅ Instructor 1 logged in');

  // Create instructor 2
  const instructor2Result = await apiRequest('/admin/instructors', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Instructor Tracking Test 2',
      email: `instructor.tracking2.${Date.now()}@test.com`,
      bio: 'Test instructor 2',
    }),
  });

  if (instructor2Result.status !== 201) {
    console.error('❌ Failed to create instructor 2');
    return false;
  }

  instructor2Id = instructor2Result.data.data.instructor.id;
  const instructor2Password = instructor2Result.data.data.temporaryPassword;
  console.log('✅ Instructor 2 created');

  // Login as instructor 2
  const instructor2LoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: instructor2Result.data.data.instructor.email,
      password: instructor2Password,
    }),
  });

  instructor2Token = instructor2LoginResult.data.data.tokens.accessToken;
  console.log('✅ Instructor 2 logged in');

  // Create student 1
  const student1Email = `student.tracking1.${Date.now()}@test.com`;
  const student1Result = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Tracking Test Student 1',
      email: student1Email,
      password: 'Student123!@#',
      gdprConsent: true,
    }),
  });

  if (student1Result.status !== 201) {
    console.error('❌ Failed to create student 1');
    console.error('Status:', student1Result.status);
    console.error('Response:', JSON.stringify(student1Result.data, null, 2));
    return false;
  }

  // Extract user ID from JWT token
  const student1TokenPayload = JSON.parse(Buffer.from(student1Result.data.data.accessToken.split('.')[1], 'base64').toString());
  student1Id = student1TokenPayload.userId;
  console.log('✅ Student 1 created');

  // Login as student 1
  const student1LoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: student1Email,
      password: 'Student123!@#',
    }),
  });

  student1Token = student1LoginResult.data.data.tokens ? student1LoginResult.data.data.tokens.accessToken : student1LoginResult.data.data.accessToken;
  console.log('✅ Student 1 logged in');

  // Create student 2
  const student2Email = `student.tracking2.${Date.now()}@test.com`;
  const student2Result = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Tracking Test Student 2',
      email: student2Email,
      password: 'Student123!@#',
      gdprConsent: true,
    }),
  });

  if (student2Result.status !== 201) {
    console.error('❌ Failed to create student 2');
    return false;
  }

  // Extract user ID from JWT token
  const student2TokenPayload = JSON.parse(Buffer.from(student2Result.data.data.accessToken.split('.')[1], 'base64').toString());
  student2Id = student2TokenPayload.userId;
  console.log('✅ Student 2 created');

  // Login as student 2
  const student2LoginResult = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: student2Email,
      password: 'Student123!@#',
    }),
  });

  student2Token = student2LoginResult.data.data.tokens ? student2LoginResult.data.data.tokens.accessToken : student2LoginResult.data.data.accessToken;
  console.log('✅ Student 2 logged in');

  // Create active subscriptions for students using direct database script
  const { execSync } = require('child_process');
  try {
    execSync(`node create-test-subscriptions.js ${student1Id} ${student2Id}`, {
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('❌ Failed to create subscriptions');
    return false;
  }

  return true;
}

// Test 2: Create course and content
async function test2_CreateCourse() {
  console.log('\n=== Test 2: Create Course ===');

  // Create course by instructor 1
  const courseResult = await apiRequest('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: JSON.stringify({
      title: 'Instructor Tracking Test Course',
      description: 'Course for testing instructor tracking',
      category: 'Technology',
      workload: 10,
    }),
  });

  if (courseResult.status !== 201) {
    console.error('❌ Failed to create course');
    return false;
  }

  course1Id = courseResult.data.data.course.id;
  console.log('✅ Course created');

  // Add module
  const moduleResult = await apiRequest(`/courses/${course1Id}/modules`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: JSON.stringify({
      title: 'Module 1',
      description: 'First module',
      order_index: 1,
    }),
  });

  if (moduleResult.status !== 201) {
    console.error('❌ Failed to create module');
    return false;
  }

  moduleId = moduleResult.data.data.module.id;
  console.log('✅ Module created');

  // Add lesson 1
  const lesson1Result = await apiRequest(`/courses/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: JSON.stringify({
      title: 'Lesson 1',
      description: 'First lesson',
      type: 'text',
      content: 'Lesson content',
      duration: 30,
      order_index: 1,
    }),
  });

  if (lesson1Result.status !== 201) {
    console.error('❌ Failed to create lesson 1');
    console.error('Status:', lesson1Result.status);
    console.error('Response:', JSON.stringify(lesson1Result.data, null, 2));
    return false;
  }

  lesson1Id = lesson1Result.data.data.lesson.id;
  console.log('✅ Lesson 1 created');

  // Add lesson 2
  const lesson2Result = await apiRequest(`/courses/modules/${moduleId}/lessons`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
    body: JSON.stringify({
      title: 'Lesson 2',
      description: 'Second lesson',
      type: 'text',
      content: 'Lesson content 2',
      duration: 45,
      order_index: 2,
    }),
  });

  if (lesson2Result.status !== 201) {
    console.error('❌ Failed to create lesson 2');
    return false;
  }

  lesson2Id = lesson2Result.data.data.lesson.id;
  console.log('✅ Lesson 2 created');

  // Submit for approval
  const submitResult = await apiRequest(`/courses/${course1Id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor1Token}` },
  });

  if (submitResult.status !== 200) {
    console.error('❌ Failed to submit course');
    return false;
  }

  console.log('✅ Course submitted for approval');

  // Approve course as admin
  const approveResult = await apiRequest(`/courses/admin/${course1Id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (approveResult.status !== 200) {
    console.error('❌ Failed to approve course');
    console.error('Status:', approveResult.status);
    console.error('Response:', JSON.stringify(approveResult.data, null, 2));
    return false;
  }

  console.log('✅ Course approved and published');

  return true;
}

// Test 3: Create course by instructor 2
async function test3_CreateCourseByInstructor2() {
  console.log('\n=== Test 3: Create Course by Instructor 2 ===');

  // Create course by instructor 2
  const courseResult = await apiRequest('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${instructor2Token}` },
    body: JSON.stringify({
      title: 'Instructor 2 Course',
      description: 'Course by instructor 2',
      category: 'Business',
      workload: 5,
    }),
  });

  if (courseResult.status !== 201) {
    console.error('❌ Failed to create course by instructor 2');
    return false;
  }

  course2Id = courseResult.data.data.course.id;
  console.log('✅ Course by instructor 2 created');

  return true;
}

// Test 4: Students start courses and make progress
async function test4_StudentsProgress() {
  console.log('\n=== Test 4: Students Make Progress ===');

  // Student 1 accesses course
  const accessResult1 = await apiRequest(`/courses/${course1Id}/content`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${student1Token}` },
  });

  if (accessResult1.status !== 200) {
    console.error('❌ Student 1 failed to access course');
    console.error('Status:', accessResult1.status);
    console.error('Response:', JSON.stringify(accessResult1.data, null, 2));
    return false;
  }

  console.log('✅ Student 1 accessed course');

  // Student 1 completes lesson 1
  const progressResult1 = await apiRequest(`/courses/${course1Id}/progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${student1Token}` },
    body: JSON.stringify({
      lessonId: lesson1Id,
    }),
  });

  if (progressResult1.status !== 200) {
    console.error('❌ Student 1 failed to mark lesson as completed');
    return false;
  }

  console.log('✅ Student 1 completed lesson 1 (50% progress)');

  // Student 2 accesses course
  const accessResult2 = await apiRequest(`/courses/${course1Id}/content`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${student2Token}` },
  });

  if (accessResult2.status !== 200) {
    console.error('❌ Student 2 failed to access course');
    return false;
  }

  console.log('✅ Student 2 accessed course');

  // Student 2 completes both lessons
  await apiRequest(`/courses/${course1Id}/progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${student2Token}` },
    body: JSON.stringify({
      lessonId: lesson1Id,
    }),
  });

  const progressResult2 = await apiRequest(`/courses/${course1Id}/progress`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${student2Token}` },
    body: JSON.stringify({
      lessonId: lesson2Id,
    }),
  });

  if (progressResult2.status !== 200) {
    console.error('❌ Student 2 failed to complete lessons');
    return false;
  }

  console.log('✅ Student 2 completed both lessons (100% progress)');

  return true;
}

// Test 5: Instructor views enrolled students
async function test5_ViewEnrolledStudents() {
  console.log('\n=== Test 5: View Enrolled Students ===');

  const result = await apiRequest(`/instructor/courses/${course1Id}/students`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${instructor1Token}` },
  });

  if (result.status !== 200) {
    console.error('❌ Failed to get enrolled students');
    console.error('Response:', result.data);
    return false;
  }

  const students = result.data.data.students;

  if (students.length !== 2) {
    console.error(`❌ Expected 2 students, got ${students.length}`);
    return false;
  }

  console.log('✅ Retrieved 2 enrolled students');

  // Verify student data
  const student1Data = students.find((s) => s.studentId === student1Id);
  const student2Data = students.find((s) => s.studentId === student2Id);

  if (!student1Data || !student2Data) {
    console.error('❌ Student data not found');
    return false;
  }

  console.log(`✅ Student 1 progress: ${student1Data.progressPercentage}%`);
  console.log(`✅ Student 2 progress: ${student2Data.progressPercentage}%`);

  if (student1Data.progressPercentage !== 50) {
    console.error(`❌ Student 1 progress should be 50%, got ${student1Data.progressPercentage}%`);
    return false;
  }

  if (student2Data.progressPercentage !== 100) {
    console.error(`❌ Student 2 progress should be 100%, got ${student2Data.progressPercentage}%`);
    return false;
  }

  console.log('✅ Student progress percentages are correct');

  return true;
}

// Test 6: Instructor 2 cannot view instructor 1's students
async function test6_InstructorCannotViewOtherStudents() {
  console.log('\n=== Test 6: Instructor Cannot View Other Instructor\'s Students ===');

  const result = await apiRequest(`/instructor/courses/${course1Id}/students`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${instructor2Token}` },
  });

  if (result.status !== 404) {
    console.error(`❌ Expected 404, got ${result.status}`);
    return false;
  }

  console.log('✅ Instructor 2 cannot view instructor 1\'s students');

  return true;
}

// Test 7: View detailed student progress
async function test7_ViewDetailedProgress() {
  console.log('\n=== Test 7: View Detailed Student Progress ===');

  const result = await apiRequest(`/instructor/students/${student1Id}/progress/${course1Id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${instructor1Token}` },
  });

  if (result.status !== 200) {
    console.error('❌ Failed to get detailed student progress');
    console.error('Response:', result.data);
    return false;
  }

  const progress = result.data.data;

  if (progress.studentId !== student1Id) {
    console.error('❌ Wrong student ID');
    return false;
  }

  if (progress.courseId !== course1Id) {
    console.error('❌ Wrong course ID');
    return false;
  }

  if (progress.progressPercentage !== 50) {
    console.error(`❌ Expected 50% progress, got ${progress.progressPercentage}%`);
    return false;
  }

  if (progress.modules.length === 0) {
    console.error('❌ No modules found');
    return false;
  }

  const module = progress.modules[0];
  if (module.lessons.length !== 2) {
    console.error(`❌ Expected 2 lessons, got ${module.lessons.length}`);
    return false;
  }

  const lesson1 = module.lessons.find((l) => l.lessonId === lesson1Id);
  const lesson2 = module.lessons.find((l) => l.lessonId === lesson2Id);

  if (!lesson1.isCompleted) {
    console.error('❌ Lesson 1 should be completed');
    return false;
  }

  if (lesson2.isCompleted) {
    console.error('❌ Lesson 2 should not be completed');
    return false;
  }

  console.log('✅ Detailed progress retrieved correctly');
  console.log(`   - Progress: ${progress.progressPercentage}%`);
  console.log(`   - Completed lessons: ${progress.completedLessons.length}/${progress.totalLessons}`);
  console.log(`   - Lesson 1: ${lesson1.isCompleted ? 'Completed' : 'Not completed'}`);
  console.log(`   - Lesson 2: ${lesson2.isCompleted ? 'Completed' : 'Not completed'}`);

  return true;
}

// Test 8: View instructor dashboard
async function test8_ViewDashboard() {
  console.log('\n=== Test 8: View Instructor Dashboard ===');

  const result = await apiRequest('/instructor/dashboard', {
    method: 'GET',
    headers: { Authorization: `Bearer ${instructor1Token}` },
  });

  if (result.status !== 200) {
    console.error('❌ Failed to get dashboard');
    console.error('Response:', result.data);
    return false;
  }

  const dashboard = result.data.data;

  if (dashboard.totalStudents !== 2) {
    console.error(`❌ Expected 2 total students, got ${dashboard.totalStudents}`);
    return false;
  }

  console.log('✅ Dashboard retrieved successfully');
  console.log(`   - Total students: ${dashboard.totalStudents}`);
  console.log(`   - Average completion rate: ${dashboard.averageCompletionRate}%`);
  console.log(`   - Pending assessments: ${dashboard.pendingAssessments}`);
  console.log(`   - Courses: ${dashboard.courses.length}`);

  if (dashboard.courses.length > 0) {
    const course = dashboard.courses[0];
    console.log(`   - Course: ${course.courseTitle}`);
    console.log(`     - Students: ${course.totalStudents}`);
    console.log(`     - Average progress: ${course.averageProgress}%`);
    console.log(`     - Completed students: ${course.completedStudents}`);
  }

  return true;
}

// Run all tests
async function runTests() {
  console.log('Starting Instructor Tracking Module Tests...');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Setup', fn: test1_Setup },
    { name: 'Create Course', fn: test2_CreateCourse },
    { name: 'Create Course by Instructor 2', fn: test3_CreateCourseByInstructor2 },
    { name: 'Students Make Progress', fn: test4_StudentsProgress },
    { name: 'View Enrolled Students', fn: test5_ViewEnrolledStudents },
    { name: 'Instructor Cannot View Other Students', fn: test6_InstructorCannotViewOtherStudents },
    { name: 'View Detailed Progress', fn: test7_ViewDetailedProgress },
    { name: 'View Dashboard', fn: test8_ViewDashboard },
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
        console.log(`\n❌ Test "${test.name}" failed`);
      }
    } catch (error) {
      failed++;
      console.error(`\n❌ Test "${test.name}" threw an error:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('='.repeat(50));
}

// Run tests
runTests().catch(console.error);
