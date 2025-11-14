import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import api from '../../services/api'
import { Course } from '../../types'

export default function CourseApprovalPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPendingCourses()
  }, [])

  const fetchPendingCourses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/courses', {
        params: { status: 'pending_approval' },
      })
      const data = response.data.data || response.data
      setCourses(data.courses || data || [])
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar cursos')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveCourse = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja aprovar este curso?')) return

    try {
      setSubmitting(true)
      await api.patch(`/admin/courses/${courseId}/approve`)
      fetchPendingCourses()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Erro ao aprovar curso')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return

    try {
      setSubmitting(true)
      await api.patch(`/admin/courses/${selectedCourse.id}/reject`, {
        reason: rejectReason,
      })
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedCourse(null)
      fetchPendingCourses()
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Erro ao rejeitar curso')
    } finally {
      setSubmitting(false)
    }
  }

  const openRejectModal = (course: Course) => {
    setSelectedCourse(course)
    setShowRejectModal(true)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Aprovação de Cursos</h1>
          <p className="mt-2 text-gray-600">
            Revise e aprove cursos pendentes de publicação
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum curso pendente</h3>
            <p className="mt-1 text-sm text-gray-500">
              Todos os cursos foram revisados.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                        <span className="ml-3 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pendente
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">{course.description}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {course.instructor?.name || 'Instrutor'}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {course.category}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {course.workload}h
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(course.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    {course.coverImage && (
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="ml-6 w-32 h-20 object-cover rounded-lg"
                      />
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/courses/${course.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver Detalhes do Curso →
                    </button>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openRejectModal(course)}
                        disabled={submitting}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleApproveCourse(course.id)}
                        disabled={submitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Aprovar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedCourse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Rejeitar Curso</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectReason('')
                    setSelectedCourse(null)
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleRejectCourse} className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Você está rejeitando o curso: <strong>{selectedCourse.title}</strong>
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Rejeição *
                  </label>
                  <textarea
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    placeholder="Explique o motivo da rejeição para que o instrutor possa fazer as correções necessárias..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectReason('')
                      setSelectedCourse(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? 'Rejeitando...' : 'Rejeitar Curso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
