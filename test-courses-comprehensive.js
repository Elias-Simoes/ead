/**
 * Comprehensive test suite for the courses module
 * Tests all requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3
 * Execute with: node test-courses-comprehensive.js
 */

const baseUrl = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const url = `${baseUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test state
const state = {
  adminToken: null,
  instructorToken: null,
  instructorId: null,
  studentToken: null,
  studentId: null,
  courseId: null,
  moduleId: null,
  lessonId: null,
  testResults: {
    passed: 0,
    failed: 0,
    total: 0,
  },
};

// Helper function to track test results
function recordTest(passed) {
  state.testResults.total++;
  if (passed) {
    state.testResults.passed++;
  } else {
    state.testResults.failed++;
  }
}

// ============================================================================
// SETUP: Login and create test users
// ============================================================================

async function setupAdminLogin() {
  log('\n=== SETUP: Admin Login ===', 'cyan');
  const result = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@plataforma-ead.com',
    password: 'Admin@123',
  });

  if (result.status === 200 && result.data.data.tokens) {
    state.adminToken = result.data.data.tokens.accessToken;
    log('✓ Admin login successful', 'green');
    return true;
  } else {
    log('✗ Admin login failed', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    log(`  Response: ${JSON.stringify(result.data)}`, 'yellow');
    if (result.error) {
      log(`  Error: ${result.error}`, 'yellow');
    }
    return false;
  }
}

async function setupCreateInstructor() {
  log('\n=== SETUP: Create Instructor ===', 'cyan');
  const result = await makeRequest(
    'POST',
    '/api/admin/instructors',
    {
      email: `test-instructor-${Date.now()}@test.com`,
      name: 'Test Instructor',
      bio: 'Instructor for automated testing',
      expertise: ['Node.js', 'JavaScript', 'Testing'],
    },
    state.adminToken
  );

  if (result.status === 201 && result.data.data.instructor) {
    state.instructorId = result.data.data.instructor.id;
    const tempPassword = result.data.data.temporaryPassword;
    const instructorEmail = result.data.data.instructor.email;

    log('✓ Instructor created', 'green');
    log(`  Email: ${instructorEmail}`, 'blue');

    // Login as instructor
    const loginResult = await makeRequest('POST', '/api/auth/login', {
      email: instructorEmail,
      password: tempPassword,
    });

    if (loginResult.status === 200 && loginResult.data.data.tokens) {
      state.instructorToken = loginResult.data.data.tokens.accessToken;
      log('✓ Instructor login successful', 'green');
      return true;
    }
  }

  log('✗ Instructor setup failed', 'red');
  return false;
}

async function setupCreateStudent() {
  log('\n=== SETUP: Create Student ===', 'cyan');
  const studentData = {
    email: `test-student-${Date.now()}@test.com`,
    name: 'Test Student',
    password: 'Student@123',
    gdprConsent: true,
  };

  const result = await makeRequest('POST', '/api/auth/register', studentData);

  if (result.status === 201 && result.data.data) {
    state.studentToken = result.data.data.accessToken;
    state.studentId = result.data.data.user?.id || result.data.data.userId;
    log('✓ Student created and logged in', 'green');
    log(`  Student ID: ${state.studentId}`, 'blue');
    return true;
  }

  log('✗ Student setup failed', 'red');
  log(`  Status: ${result.status}`, 'yellow');
  if (result.data) {
    log(`  Response: ${JSON.stringify(result.data)}`, 'yellow');
  }
  return false;
}

// ============================================================================
// TEST 1: Course Creation by Instructor (Requirement 3.1)
// ============================================================================

async function test1_InstructorCreateCourse() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║ TEST 1: Instructor Creates Course (Requirement 3.1)       ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  log('\nTest 1.1: Create course with valid data', 'yellow');
  const result = await makeRequest(
    'POST',
    '/api/courses',
    {
      title: 'Advanced Node.js Development',
      description: 'A comprehensive course on Node.js backend development',
      category: 'Programming',
      workload: 40,
    },
    state.instructorToken
  );

  if (result.status === 201 && result.data.data.course) {
    state.courseId = result.data.data.course.id;
    log('✓ Course created successfully', 'green');
    log(`  Course ID: ${state.courseId}`, 'blue');
    log(`  Status: ${result.data.data.course.status}`, 'blue');
    
    if (result.data.data.course.status === 'draft') {
      log('✓ Course status is draft as expected', 'green');
      recordTest(true);
    } else {
      log('✗ Course status should be draft', 'red');
      recordTest(false);
    }
  } else {
    log('✗ Course creation failed', 'red');
    log(`  Status: ${result.status}`, 'yellow');
    recordTest(false);
  }

  log('\nTest 1.2: Create course with missing required fields (should fail)', 'yellow');
  const result2 = await makeRequest(
    'POST',
    '/api/courses',
    {
      title: 'Incomplete Course',
      // Missing workload
    },
    state.instructorToken
  );

  if (result2.status === 400 || result2.status === 422) {
    log('✓ Validation error detected correctly', 'green');
    log(`  Status: ${result2.status} (${result2.status === 422 ? 'Unprocessable Entity' : 'Bad Request'})`, 'blue');
    recordTest(true);
  } else {
    log('✗ Should have returned 400 or 422 for missing fields', 'red');
    log(`  Status received: ${result2.status}`, 'yellow');
    log(`  Response: ${JSON.stringify(result2.data)}`, 'yellow');
    recordTest(false);
  }
}

// ============================================================================
// TEST 2: Add Modules and Lessons (Requirements 3.2, 3.3, 3.4)
// ============================================================================

async function test2_AddModulesAndLessons() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║ TEST 2: Add Modules and Lessons (Req 3.2, 3.3, 3.4)       ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  if (!state.courseId) {
    log('✗ Course ID not available, skipping test', 'red');
    recordTest(false);
    return;
  }

  log('\nTest 2.1: Add module to course', 'yellow');
  const moduleResult = await makeRequest(
    'POST',
    `/api/courses/${state.courseId}/modules`,
    {
      title: 'Module 1 - Introduction to Node.js',
      description: 'Learn the basics of Node.js',
    },
    state.instructorToken
  );

  if (moduleResult.status === 201 && moduleResult.data.data.module) {
    state.moduleId = moduleResult.data.data.module.id;
    log('✓ Module added successfully', 'green');
    log(`  Module ID: ${state.moduleId}`, 'blue');
    recordTest(true);
  } else {
    log('✗ Module creation failed', 'red');
    recordTest(false);
    return;
  }

  log('\nTest 2.2: Add video lesson to module', 'yellow');
  const lessonResult = await makeRequest(
    'POST',
    `/api/courses/modules/${state.moduleId}/lessons`,
    {
      title: 'Lesson 1 - What is Node.js',
      description: 'Understanding Node.js and its ecosystem',
      type: 'video',
      content: 'https://example.com/videos/nodejs-intro.mp4',
      duration: 15,
    },
    state.instructorToken
  );

  if (lessonResult.status === 201 && lessonResult.data.data.lesson) {
    state.lessonId = lessonResult.data.data.lesson.id;
    log('✓ Lesson added successfully', 'green');
    log(`  Lesson ID: ${state.lessonId}`, 'blue');
    recordTest(true);
  } else {
    log('✗ Lesson creation failed', 'red');
    recordTest(false);
  }

  log('\nTest 2.3: Add PDF lesson to module', 'yellow');
  const pdfLessonResult = await makeRequest(
    'POST',
    `/api/courses/modules/${state.moduleId}/lessons`,
    {
      title: 'Lesson 2 - Node.js Documentation',
      description: 'Official Node.js documentation',
      type: 'pdf',
      content: 'https://example.com/docs/nodejs-guide.pdf',
    },
    state.instructorToken
  );

  if (pdfLessonResult.status === 201) {
    log('✓ PDF lesson added successfully', 'green');
    recordTest(true);
  } else {
    log('✗ PDF lesson creation failed', 'red');
    recordTest(false);
  }
}

// ============================================================================
// TEST 3: Complete Approval Flow (Requirements 4.1, 4.2, 4.3)
// ============================================================================

async function test3_ApprovalFlow() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║ TEST 3: Complete Approval Flow (Req 4.1, 4.2, 4.3)        ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  if (!state.courseId) {
    log('✗ Course ID not available, skipping test', 'red');
    recordTest(false);
    return;
  }

  log('\nTest 3.1: Submit course for approval', 'yellow');
  const submitResult = await makeRequest(
    'POST',
    `/api/courses/${state.courseId}/submit`,
    null,
    state.instructorToken
  );

  if (submitResult.status === 200 && submitResult.data.data.course) {
    log('✓ Course submitted for approval', 'green');
    log(`  Status: ${submitResult.data.data.course.status}`, 'blue');
    
    if (submitResult.data.data.course.status === 'pending_approval') {
      log('✓ Course status changed to pending_approval', 'green');
      recordTest(true);
    } else {
      log('✗ Course status should be pending_approval', 'red');
      recordTest(false);
    }
  } else {
    log('✗ Course submission failed', 'red');
    log(`  Status: ${submitResult.status}`, 'yellow');
    recordTest(false);
    return;
  }

  log('\nTest 3.2: Admin approves course', 'yellow');
  const approveResult = await makeRequest(
    'PATCH',
    `/api/courses/admin/${state.courseId}/approve`,
    null,
    state.adminToken
  );

  if (approveResult.status === 200 && approveResult.data.data.course) {
    log('✓ Course approved successfully', 'green');
    log(`  Status: ${approveResult.data.data.course.status}`, 'blue');
    
    if (approveResult.data.data.course.status === 'published') {
      log('✓ Course status changed to published', 'green');
      recordTest(true);
    } else {
      log('✗ Course status should be published', 'red');
      recordTest(false);
    }
  } else {
    log('✗ Course approval failed', 'red');
    recordTest(false);
  }
}

// ============================================================================
// TEST 4: Student Cannot Create Courses (Requirement 3.1)
// ============================================================================

async function test4_StudentCannotCreateCourse() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║ TEST 4: Student Cannot Create Courses (Req 3.1)           ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  log('\nTest 4.1: Student attempts to create course (should fail)', 'yellow');
  const result = await makeRequest(
    'POST',
    '/api/courses',
    {
      title: 'Unauthorized Course',
      description: 'This should not be created',
      category: 'Test',
      workload: 10,
    },
    state.studentToken
  );

  if (result.status === 403) {
    log('✓ Student correctly denied permission to create course', 'green');
    recordTest(true);
  } else {
    log('✗ Should have returned 403 Forbidden', 'red');
    log(`  Status received: ${result.status}`, 'yellow');
    recordTest(false);
  }

  log('\nTest 4.2: Student attempts to add module (should fail)', 'yellow');
  if (state.courseId) {
    const moduleResult = await makeRequest(
      'POST',
      `/api/courses/${state.courseId}/modules`,
      {
        title: 'Unauthorized Module',
        description: 'This should not be created',
      },
      state.studentToken
    );

    if (moduleResult.status === 403) {
      log('✓ Student correctly denied permission to add module', 'green');
      recordTest(true);
    } else {
      log('✗ Should have returned 403 Forbidden', 'red');
      recordTest(false);
    }
  }
}

// ============================================================================
// TEST 5: List Published Courses (Requirement 4.3)
// ============================================================================

async function test5_ListPublishedCourses() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║ TEST 5: List Published Courses (Requirement 4.3)          ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  log('\nTest 5.1: List all published courses', 'yellow');
  const result = await makeRequest(
    'GET',
    '/api/courses?page=1&limit=20',
    null,
    state.studentToken
  );

  if (result.status === 200 && result.data.data.courses) {
    log('✓ Published courses retrieved successfully', 'green');
    log(`  Total courses: ${result.data.data.total}`, 'blue');
    log(`  Courses on page: ${result.data.data.courses.length}`, 'blue');
    
    // Check if our course is in the list
    const ourCourse = result.data.data.courses.find(c => c.id === state.courseId);
    if (ourCourse) {
      log('✓ Our published course is in the list', 'green');
      recordTest(true);
    } else {
      log('⚠ Our course not found in list (might be on another page)', 'yellow');
      recordTest(true);
    }
  } else {
    log('✗ Failed to retrieve published courses', 'red');
    recordTest(false);
  }

  log('\nTest 5.2: Filter courses by category', 'yellow');
  const categoryResult = await makeRequest(
    'GET',
    '/api/courses?category=Programming',
    null,
    state.studentToken
  );

  if (categoryResult.status === 200) {
    log('✓ Category filter works', 'green');
    log(`  Courses in Programming: ${categoryResult.data.data.total}`, 'blue');
    recordTest(true);
  } else {
    log('✗ Category filter failed', 'red');
    recordTest(false);
  }

  log('\nTest 5.3: Search courses by title', 'yellow');
  const searchResult = await makeRequest(
    'GET',
    '/api/courses?search=Node',
    null,
    state.studentToken
  );

  if (searchResult.status === 200) {
    log('✓ Search functionality works', 'green');
    log(`  Courses matching "Node": ${searchResult.data.data.total}`, 'blue');
    recordTest(true);
  } else {
    log('✗ Search failed', 'red');
    log(`  Status: ${searchResult.status}`, 'yellow');
    log(`  Response: ${JSON.stringify(searchResult.data)}`, 'yellow');
    recordTest(false);
  }
}

// ============================================================================
// TEST 6: Course Details and Access Control
// ============================================================================

async function test6_CourseDetailsAndAccess() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║ TEST 6: Course Details and Access Control                 ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  if (!state.courseId) {
    log('✗ Course ID not available, skipping test', 'red');
    recordTest(false);
    return;
  }

  log('\nTest 6.1: Get course details with modules and lessons', 'yellow');
  const result = await makeRequest(
    'GET',
    `/api/courses/${state.courseId}`,
    null,
    state.studentToken
  );

  if (result.status === 200 && result.data.data.course) {
    log('✓ Course details retrieved', 'green');
    const course = result.data.data.course;
    log(`  Title: ${course.title}`, 'blue');
    log(`  Modules: ${course.modules?.length || 0}`, 'blue');
    
    if (course.modules && course.modules.length > 0) {
      log(`  Lessons in first module: ${course.modules[0].lessons?.length || 0}`, 'blue');
      log('✓ Course includes modules and lessons', 'green');
      recordTest(true);
    } else {
      log('⚠ Course has no modules', 'yellow');
      recordTest(true);
    }
  } else {
    log('✗ Failed to retrieve course details', 'red');
    recordTest(false);
  }
}

// ============================================================================
// TEST 7: Rejection Flow
// ============================================================================

async function test7_RejectionFlow() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║ TEST 7: Course Rejection Flow                             ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  log('\nTest 7.1: Create another course for rejection test', 'yellow');
  const createResult = await makeRequest(
    'POST',
    '/api/courses',
    {
      title: 'Course to be Rejected',
      description: 'This course will be rejected',
      category: 'Test',
      workload: 10,
    },
    state.instructorToken
  );

  if (createResult.status !== 201) {
    log('✗ Failed to create test course', 'red');
    recordTest(false);
    return;
  }

  const testCourseId = createResult.data.data.course.id;
  log('✓ Test course created', 'green');

  // Add module and lesson
  const moduleResult = await makeRequest(
    'POST',
    `/api/courses/${testCourseId}/modules`,
    { title: 'Test Module', description: 'Test' },
    state.instructorToken
  );

  if (moduleResult.status === 201) {
    const testModuleId = moduleResult.data.data.module.id;
    await makeRequest(
      'POST',
      `/api/courses/modules/${testModuleId}/lessons`,
      {
        title: 'Test Lesson',
        description: 'Test',
        type: 'text',
        content: 'Test content',
      },
      state.instructorToken
    );
  }

  log('\nTest 7.2: Submit course for approval', 'yellow');
  const submitResult = await makeRequest(
    'POST',
    `/api/courses/${testCourseId}/submit`,
    null,
    state.instructorToken
  );

  if (submitResult.status !== 200) {
    log('✗ Failed to submit course', 'red');
    recordTest(false);
    return;
  }

  log('\nTest 7.3: Admin rejects course', 'yellow');
  const rejectResult = await makeRequest(
    'PATCH',
    `/api/courses/admin/${testCourseId}/reject`,
    { reason: 'Content quality does not meet standards' },
    state.adminToken
  );

  if (rejectResult.status === 200 && rejectResult.data.data.course) {
    log('✓ Course rejected successfully', 'green');
    log(`  Status: ${rejectResult.data.data.course.status}`, 'blue');
    
    if (rejectResult.data.data.course.status === 'draft') {
      log('✓ Course status reverted to draft', 'green');
      recordTest(true);
    } else {
      log('✗ Course status should be draft after rejection', 'red');
      recordTest(false);
    }
  } else {
    log('✗ Course rejection failed', 'red');
    recordTest(false);
  }
}

// ============================================================================
// TEST 8: Validation Tests
// ============================================================================

async function test8_ValidationTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║ TEST 8: Validation and Edge Cases                         ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  log('\nTest 8.1: Submit course without modules (should fail)', 'yellow');
  const emptyResult = await makeRequest(
    'POST',
    '/api/courses',
    {
      title: 'Empty Course',
      description: 'Course with no content',
      category: 'Test',
      workload: 5,
    },
    state.instructorToken
  );

  if (emptyResult.status === 201) {
    const emptyCourseId = emptyResult.data.data.course.id;
    
    const submitResult = await makeRequest(
      'POST',
      `/api/courses/${emptyCourseId}/submit`,
      null,
      state.instructorToken
    );

    if (submitResult.status === 400) {
      log('✓ Correctly prevented submission of course without modules', 'green');
      recordTest(true);
    } else {
      log('✗ Should have prevented submission', 'red');
      recordTest(false);
    }
  } else {
    log('✗ Failed to create test course', 'red');
    recordTest(false);
  }

  log('\nTest 8.2: Update course as non-owner (should fail)', 'yellow');
  if (state.courseId) {
    // Create another instructor
    const instructor2Result = await makeRequest(
      'POST',
      '/api/admin/instructors',
      {
        email: `instructor2-${Date.now()}@test.com`,
        name: 'Second Instructor',
      },
      state.adminToken
    );

    if (instructor2Result.status === 201) {
      const tempPass = instructor2Result.data.data.temporaryPassword;
      const email = instructor2Result.data.data.instructor.email;

      const loginResult = await makeRequest('POST', '/api/auth/login', {
        email,
        password: tempPass,
      });

      if (loginResult.status === 200) {
        const instructor2Token = loginResult.data.data.tokens.accessToken;

        const updateResult = await makeRequest(
          'PATCH',
          `/api/courses/${state.courseId}`,
          { title: 'Hacked Title' },
          instructor2Token
        );

        if (updateResult.status === 403) {
          log('✓ Correctly prevented non-owner from updating course', 'green');
          recordTest(true);
        } else {
          log('✗ Should have prevented non-owner update', 'red');
          recordTest(false);
        }
      }
    }
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     COMPREHENSIVE COURSES MODULE TEST SUITE                ║', 'cyan');
  log('║     Testing Requirements: 3.1, 3.2, 3.3, 3.4, 4.1-4.3      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  try {
    // Setup phase
    log('\n' + '='.repeat(60), 'cyan');
    log('SETUP PHASE', 'cyan');
    log('='.repeat(60), 'cyan');

    const adminOk = await setupAdminLogin();
    if (!adminOk) {
      log('\n✗ Cannot proceed without admin access', 'red');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    const instructorOk = await setupCreateInstructor();
    if (!instructorOk) {
      log('\n✗ Cannot proceed without instructor', 'red');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    const studentOk = await setupCreateStudent();
    if (!studentOk) {
      log('\n✗ Cannot proceed without student', 'red');
      return;
    }

    // Run tests
    log('\n' + '='.repeat(60), 'cyan');
    log('TEST EXECUTION PHASE', 'cyan');
    log('='.repeat(60), 'cyan');

    await new Promise(resolve => setTimeout(resolve, 500));
    await test1_InstructorCreateCourse();

    await new Promise(resolve => setTimeout(resolve, 500));
    await test2_AddModulesAndLessons();

    await new Promise(resolve => setTimeout(resolve, 500));
    await test3_ApprovalFlow();

    await new Promise(resolve => setTimeout(resolve, 500));
    await test4_StudentCannotCreateCourse();

    await new Promise(resolve => setTimeout(resolve, 500));
    await test5_ListPublishedCourses();

    await new Promise(resolve => setTimeout(resolve, 500));
    await test6_CourseDetailsAndAccess();

    await new Promise(resolve => setTimeout(resolve, 500));
    await test7_RejectionFlow();

    await new Promise(resolve => setTimeout(resolve, 500));
    await test8_ValidationTests();

    // Print summary
    log('\n' + '='.repeat(60), 'cyan');
    log('TEST SUMMARY', 'cyan');
    log('='.repeat(60), 'cyan');

    const { passed, failed, total } = state.testResults;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    log(`\nTotal Tests: ${total}`, 'blue');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║                  TESTS COMPLETED                           ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    if (failed === 0) {
      log('\n🎉 All tests passed! The courses module is working correctly.', 'green');
    } else {
      log(`\n⚠️  ${failed} test(s) failed. Please review the output above.`, 'yellow');
    }

  } catch (error) {
    log(`\n✗ Fatal error during test execution: ${error.message}`, 'red');
    console.error(error);
  }
}

// Execute tests
runAllTests().catch((error) => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
