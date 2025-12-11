import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { SubscriptionWarning } from '../components/SubscriptionWarning'
import api from '../services/api'
import { Course, Module, StudentProgress } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchCourseDetails()
      // Only fetch progress for students
      if (user?.role === 'student') {
        fetchProgress()
      }
    }
  }, [id, user])

  const fetchCourseDetails = async () => {
    try {
      // Try to get course with full details first
      const response = await api.get<{ data: { course: Course } }>(`/courses/${id}`)
      setCourse(response.data.data.course)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar curso')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await api.get<{ data: StudentProgress[] }>('/students/courses/progress')
      const courseProgress = response.data.data.find((p) => p.courseId === id)
      if (courseProgress) {
        setProgress(courseProgress)
      }
    } catch (err) {
      // Progress not found is ok
    }
  }

  const handleStartCourse = async () => {
    if (!course?.modules?.[0]?.lessons?.[0]) return

    const firstLesson = course.modules[0].lessons[0]
    navigate(`/courses/${id}/lessons/${firstLesson.id}`)
  }

  const handleToggleFavorite = async () => {
    // Only students can favorite courses
    if (user?.role !== 'student') {
      return
    }
    
    try {
      await api.patch(`/courses/${id}/favorite`)
      setProgress((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null))
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Erro ao favoritar curso')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error || 'Curso não encontrado'}
          </div>
        </div>
      </div>
    )
  }

  const totalLessons = course.modules?.reduce(
    (acc, module) => acc + (module.lessons?.length || 0),
    0
  ) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Warning */}
        <SubscriptionWarning />
        
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/3">
              {course.coverImage ? (
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="md:w-2/3 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                    {course.category}
                  </span>
                </div>
                <button
                  onClick={handleToggleFavorite}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg
                    className={`w-8 h-8 ${progress?.isFavorite ? 'fill-red-500 text-red-500' : ''}`}
                    fill={progress?.isFavorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {course.workload} horas
                </span>
                <span className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {totalLessons} aulas
                </span>
              </div>

              {progress && user?.role === 'student' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">Seu progresso</span>
                    <span className="text-gray-700">{progress.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${progress.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {user?.role === 'student' && (
                <button
                  onClick={handleStartCourse}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium text-lg"
                >
                  {progress ? 'Continuar Curso' : 'Iniciar Curso'}
                </button>
              )}
              
              {user?.role === 'admin' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                  <p className="font-medium">Modo de Visualização Admin</p>
                  <p className="text-sm">Você está visualizando este curso para aprovação.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Conteúdo do Curso</h2>
          <div className="space-y-4">
            {course.modules?.map((module: Module, moduleIndex: number) => (
              <div key={module.id} className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Módulo {moduleIndex + 1}: {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                  )}
                </div>
                <div className="divide-y divide-gray-200">
                  {module.lessons?.map((lesson, lessonIndex) => {
                    const isCompleted = progress?.completedLessons.includes(lesson.id)
                    const lessonUrl = `/courses/${id}/lessons/${lesson.id}`
                    
                    const handleLessonClick = () => {
                      console.log('Clicou na aula:', lesson.title)
                      console.log('URL da aula:', lessonUrl)
                      console.log('ID do curso:', id)
                      console.log('ID da aula:', lesson.id)
                      // O Link do React Router já vai fazer a navegação
                    }
                    
                    return (
                      <Link
                        key={lesson.id}
                        to={lessonUrl}
                        onClick={handleLessonClick}
                        className="flex items-center px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 mr-4">
                          {isCompleted ? (
                            <svg
                              className="w-6 h-6 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">
                            {lessonIndex + 1}. {lesson.title}
                          </p>
                          {lesson.description && (
                            <p className="text-gray-500 text-sm">{lesson.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            {lesson.type === 'video' && (
                              <>
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {lesson.duration} min
                              </>
                            )}
                            {lesson.type === 'pdf' && 'PDF'}
                            {lesson.type === 'text' && 'Texto'}
                            {lesson.type === 'external_link' && 'Link'}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
