import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import {
  HomePage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  CoursesPage,
  CourseDetailPage,
  LessonPlayerPage,
  MyCoursesPage,
  ProfilePage,
  CertificatesPage,
  InstructorDashboardPage,
  CourseFormPage,
  ModulesManagementPage,
  LessonFormPage,
  AssessmentsManagementPage,
  GradingPage,
  CourseStudentsPage,
  AdminDashboardPage,
  InstructorsManagementPage,
  CourseApprovalPage,
  SubscriptionsManagementPage,
  ReportsPage,
} from './pages'
import AssessmentFormPage from './pages/instructor/AssessmentFormPage'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPlayerPage />} />
            <Route path="/my-courses" element={<MyCoursesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            
            {/* Instructor Routes */}
            <Route path="/instructor/dashboard" element={<InstructorDashboardPage />} />
            <Route path="/instructor/courses/new" element={<CourseFormPage />} />
            <Route path="/instructor/courses/:id" element={<CourseFormPage />} />
            <Route path="/instructor/courses/:id/modules" element={<ModulesManagementPage />} />
            <Route path="/instructor/courses/:id/modules/:moduleId/lessons/new" element={<LessonFormPage />} />
            <Route path="/instructor/courses/:id/modules/:moduleId/lessons/:lessonId" element={<LessonFormPage />} />
            <Route path="/instructor/courses/:id/assessments" element={<AssessmentsManagementPage />} />
            <Route path="/instructor/courses/:courseId/assessments/new" element={<AssessmentFormPage />} />
            <Route path="/instructor/courses/:courseId/assessments/:assessmentId/edit" element={<AssessmentFormPage />} />
            <Route path="/instructor/courses/:id/students" element={<CourseStudentsPage />} />
            <Route path="/instructor/assessments/pending" element={<GradingPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/instructors" element={<InstructorsManagementPage />} />
            <Route path="/admin/courses/pending" element={<CourseApprovalPage />} />
            <Route path="/admin/subscriptions" element={<SubscriptionsManagementPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
