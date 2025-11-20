// User types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'student'
  isActive: boolean
  lastAccessAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Student extends User {
  subscriptionStatus: 'active' | 'suspended' | 'cancelled'
  subscriptionExpiresAt?: Date
  totalStudyTime: number
}

export interface Instructor extends User {
  bio?: string
  expertise?: string[]
  isSuspended: boolean
}

// Course types
export interface Course {
  id: string
  title: string
  description: string
  coverImage: string
  category: string
  workload: number
  instructorId: string
  instructor?: Instructor
  status: 'draft' | 'pending_approval' | 'published' | 'archived'
  version: number
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  modules?: Module[]
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  createdAt: Date
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  moduleId: string
  title: string
  description: string
  type: 'video' | 'pdf' | 'text' | 'external_link'
  content: string
  duration?: number
  order: number
  createdAt: Date
}

// Progress types
export interface StudentProgress {
  id: string
  studentId: string
  courseId: string
  course?: Course
  completedLessons: string[]
  progressPercentage: number
  lastAccessedAt: Date
  startedAt: Date
  completedAt?: Date
  isFavorite: boolean
}

// Assessment types
export interface Assessment {
  id: string
  courseId: string
  title: string
  type: 'multiple_choice' | 'essay'
  passingScore: number
  questions: Question[]
  createdAt: Date
}

export interface Question {
  id: string
  assessmentId: string
  text: string
  type: 'multiple_choice' | 'essay'
  options?: string[]
  correctAnswer?: number
  points: number
  order: number
}

export interface StudentAssessment {
  id: string
  studentId: string
  assessmentId: string
  assessment?: Assessment
  answers: Answer[]
  score?: number
  status: 'pending' | 'graded'
  submittedAt: Date
  gradedAt?: Date
  gradedBy?: string
}

export interface Answer {
  questionId: string
  answer: string | number
  points?: number
}

export interface CreateQuestionData {
  text: string
  type: 'multiple_choice' | 'essay'
  options?: string[]
  correct_answer?: number
  points: number
  order_index: number
}

export interface UpdateQuestionData {
  text?: string
  options?: string[]
  correct_answer?: number
  points?: number
  order_index?: number
}

// Certificate types
export interface Certificate {
  id: string
  studentId: string
  courseId: string
  course?: Course
  verificationCode: string
  pdfUrl: string
  issuedAt: Date
}

// Subscription types
export interface Subscription {
  id: string
  studentId: string
  planId: string
  plan?: Plan
  status: 'active' | 'suspended' | 'cancelled'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelledAt?: Date
  gatewaySubscriptionId: string
  createdAt: Date
}

export interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  isActive: boolean
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    path: string
  }
}
