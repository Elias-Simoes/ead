-- Migration: Add performance indexes
-- Description: Add indexes to frequently queried columns for better performance

-- Courses table indexes
CREATE INDEX IF NOT EXISTS idx_courses_status_published_at ON courses(status, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_instructor_status ON courses(instructor_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_title_search ON courses USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_courses_description_search ON courses USING gin(to_tsvector('english', description));

-- Modules table indexes
CREATE INDEX IF NOT EXISTS idx_modules_course_order ON modules(course_id, order_index);

-- Lessons table indexes
CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(type);

-- Student progress table indexes
CREATE INDEX IF NOT EXISTS idx_student_progress_student_last_accessed ON student_progress(student_id, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_progress_course ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_completed ON student_progress(student_id) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_student_progress_percentage ON student_progress(progress_percentage);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_student_status ON subscriptions(student_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_gateway_id ON subscriptions(gateway_subscription_id);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_subscription_status ON payments(subscription_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_id ON payments(gateway_payment_id);

-- Assessments table indexes
CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id);

-- Questions table indexes
CREATE INDEX IF NOT EXISTS idx_questions_assessment_order ON questions(assessment_id, order_index);

-- Student assessments table indexes
CREATE INDEX IF NOT EXISTS idx_student_assessments_student ON student_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_assessments_assessment ON student_assessments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_student_assessments_status ON student_assessments(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_student_assessments_graded_by ON student_assessments(graded_by) WHERE graded_by IS NOT NULL;

-- Certificates table indexes
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);

-- Audit logs table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Users table additional indexes
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_access ON users(last_access_at DESC) WHERE last_access_at IS NOT NULL;

-- Instructors table indexes
CREATE INDEX IF NOT EXISTS idx_instructors_suspended ON instructors(is_suspended) WHERE is_suspended = true;

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_subscription_status ON students(subscription_status);
CREATE INDEX IF NOT EXISTS idx_students_subscription_expires ON students(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;

-- Course versions table indexes
CREATE INDEX IF NOT EXISTS idx_course_versions_course_version ON course_versions(course_id, version DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_courses_status_published_at IS 'Optimizes queries for published courses ordered by publication date';
COMMENT ON INDEX idx_courses_category IS 'Optimizes category filtering';
COMMENT ON INDEX idx_student_progress_student_last_accessed IS 'Optimizes student progress queries ordered by last access';
COMMENT ON INDEX idx_subscriptions_period_end IS 'Optimizes expired subscription checks';
COMMENT ON INDEX idx_student_assessments_status IS 'Optimizes pending assessment queries for instructors';
