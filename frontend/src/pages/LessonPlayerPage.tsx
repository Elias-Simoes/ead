import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import api from '../services/api'
import { Course, Lesson, Module } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const LessonPlayerPage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  useEffect(() => {
    if (courseId && lessonId) {
      fetchCourseContent()
      // Only fetch progress for students
      if (user?.role === 'student') {
        fetchProgress()
      }
    }
  }, [courseId, lessonId, user])

  const fetchCourseContent = async () => {
    try {
      const response = await api.get<{ data: { course: Course } }>(`/courses/${courseId}`)
      setCourse(response.data.data.course)

      // Find current lesson
      const lesson = findLesson(response.data.data.course, lessonId!)
      if (lesson) {
        setCurrentLesson(lesson)
        // Fetch lesson content
        fetchLessonContent(lessonId!)
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar conteúdo')
    } finally {
      setLoading(false)
    }
  }

  const fetchLessonContent = async (id: string) => {
    try {
      const response = await api.get<{ data: Lesson }>(`/lessons/${id}/content`)
      setCurrentLesson(response.data.data)
    } catch (err) {
      // Use cached lesson data
    }
  }

  const fetchProgress = async () => {
    try {
      const response = await api.get('/students/courses/progress')
      const progress = response.data.data.find((p: any) => p.courseId === courseId)
      if (progress) {
        setCompletedLessons(progress.completedLessons)
      }
    } catch (err) {
      // Progress not found
    }
  }

  const findLesson = (course: Course, lessonId: string): Lesson | null => {
    for (const module of course.modules || []) {
      const lesson = module.lessons?.find((l) => l.id === lessonId)
      if (lesson) return lesson
    }
    return null
  }

  const getAllLessons = (): { lesson: Lesson; moduleTitle: string }[] => {
    const lessons: { lesson: Lesson; moduleTitle: string }[] = []
    course?.modules?.forEach((module) => {
      module.lessons?.forEach((lesson) => {
        lessons.push({ lesson, moduleTitle: module.title })
      })
    })
    return lessons
  }

  const handleMarkComplete = async () => {
    if (!currentLesson) return
    
    // Only students can mark lessons as complete
    if (user?.role !== 'student') {
      return
    }

    try {
      await api.post(`/courses/${courseId}/progress`, {
        lessonId: currentLesson.id,
      })
      setCompletedLessons([...completedLessons, currentLesson.id])

      // Navigate to next lesson
      const allLessons = getAllLessons()
      const currentIndex = allLessons.findIndex((l) => l.lesson.id === currentLesson.id)
      if (currentIndex < allLessons.length - 1) {
        const nextLesson = allLessons[currentIndex + 1]
        navigate(`/courses/${courseId}/lessons/${nextLesson.lesson.id}`)
      } else {
        // Course completed
        alert('Parabéns! Você concluiu todas as aulas deste curso.')
        navigate(`/courses/${courseId}`)
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Erro ao marcar aula como concluída')
    }
  }

  const handleNavigateLesson = (lessonId: string) => {
    navigate(`/courses/${courseId}/lessons/${lessonId}`)
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

  if (error || !course || !currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error || 'Aula não encontrada'}
          </div>
        </div>
      </div>
    )
  }

  const allLessons = getAllLessons()
  const currentIndex = allLessons.findIndex((l) => l.lesson.id === currentLesson.id)
  const isCompleted = completedLessons.includes(currentLesson.id)

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video/Content Player */}
          <div className="flex-1 bg-black flex items-center justify-center">
            {currentLesson.type === 'video' ? (
              <video
                src={currentLesson.content}
                controls
                className="w-full h-full"
                controlsList="nodownload"
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            ) : currentLesson.type === 'pdf' ? (
              <iframe
                src={currentLesson.content}
                className="w-full h-full"
                title={currentLesson.title}
              />
            ) : currentLesson.type === 'text' ? (
              <div className="w-full h-full overflow-auto bg-white p-8">
                <div
                  className="prose max-w-4xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                />
              </div>
            ) : (
              <div className="text-white text-center">
                <p className="mb-4">Conteúdo externo</p>
                <a
                  href={currentLesson.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md inline-block"
                >
                  Abrir Link
                </a>
              </div>
            )}
          </div>

          {/* Lesson Info and Controls */}
          <div className="bg-gray-800 text-white p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                  {currentLesson.description && (
                    <p className="text-gray-300">{currentLesson.description}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className="text-gray-300 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      if (currentIndex > 0) {
                        handleNavigateLesson(allLessons[currentIndex - 1].lesson.id)
                      }
                    }}
                    disabled={currentIndex === 0}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => {
                      if (currentIndex < allLessons.length - 1) {
                        handleNavigateLesson(allLessons[currentIndex + 1].lesson.id)
                      }
                    }}
                    disabled={currentIndex === allLessons.length - 1}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md"
                  >
                    Próxima →
                  </button>
                </div>
                {!isCompleted && (
                  <button
                    onClick={handleMarkComplete}
                    className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-md font-medium"
                  >
                    Marcar como Concluída
                  </button>
                )}
                {isCompleted && (
                  <span className="flex items-center text-green-400">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Concluída
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Lesson List */}
        <div className="w-96 bg-white overflow-y-auto border-l border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Conteúdo do Curso</h3>
            <div className="space-y-2">
              {course.modules?.map((module: Module) => (
                <div key={module.id}>
                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">{module.title}</h4>
                  {module.lessons?.map((lesson) => {
                    const isActive = lesson.id === currentLesson.id
                    const isLessonCompleted = completedLessons.includes(lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleNavigateLesson(lesson.id)}
                        className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-50 border-l-4 border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            {isLessonCompleted ? (
                              <svg
                                className="w-5 h-5 text-green-500"
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
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                isActive ? 'text-blue-600' : 'text-gray-900'
                              }`}
                            >
                              {lesson.title}
                            </p>
                            {lesson.duration && (
                              <p className="text-xs text-gray-500">{lesson.duration} min</p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
