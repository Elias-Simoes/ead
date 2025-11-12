// Shared types and interfaces

export type UserRole = 'admin' | 'instructor' | 'student';

export type CourseStatus = 'draft' | 'pending_approval' | 'published' | 'archived';

export type LessonType = 'video' | 'pdf' | 'text' | 'external_link';

export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type AssessmentType = 'multiple_choice' | 'essay';

export type AssessmentStatus = 'pending' | 'graded';
