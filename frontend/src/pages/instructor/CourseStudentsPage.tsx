import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import api from '../../services/api'
import { Course, StudentProgress } from '../../types'

interface EnrolledStudent {
  id: string
  name: string
  email: string
  progress: StudentProgress
}

export const CourseStudentsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<EnrolledStudent | null>(null)
  const [detailedProgress, setDetailedProgress] = useState<any>(null)

  useEffect(() => {
    fetchCourseAndStudents()
  }, [id])

  const fetchCourseAndStudents = async () => {
    try {
      setLoading(true)
      const [courseRes, studentsRes] = await Promise.all([
        api.get<{ data: Course }>(`/courses/${id}`),
        api.get<{ data: EnrolledStudent[] }>(`/instructor/courses/${id}/students`),
      ])
      setCourse(courseRes.data.data)
      setStudents(studentsRes.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentProgress = async (studentId: string) => {
    try {
      const response = await api.get(`/instructor/students/${studentId}/progress/${id}`)
      setDetailedProgress(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar progresso')
    }
  }

  const openStudentDetails = (student: EnrolledStudent) => {
    setSelectedStudent(student)
    fetchStudentProgress(student.id)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
          <p className="text-gray-600 mt-2">
            {students.length} {students.length === 1 ? 'aluno matriculado' : 'alunos matriculados'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Student Details Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedStudent(null)
                    setDetailedProgress(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Progresso</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedStudent.progress.progressPercentage}%
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Aulas Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedStudent.progress.completedLessons.length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Último Acesso</p>
                  <p className="text-sm font-medium text-purple-600">
                    {new Date(selectedStudent.progress.lastAccessedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Detailed Progress */}
              {detailedProgress && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Progresso Detalhado</h3>
                  {detailedProgress.modules?.map((module: any, index: number) => (
                    <div key={module.id} className="mb-4 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Módulo {index + 1}: {module.title}
                      </h4>
                      <div className="space-y-2">
                        {module.lessons?.map((lesson: any) => {
                          const isCompleted = selectedStudent.progress.completedLessons.includes(lesson.id)
                          return (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="text-sm text-gray-700">{lesson.title}</span>
                              {isCompleted ? (
                                <span className="text-green-600 text-sm font-medium">✓ Concluída</span>
                              ) : (
                                <span className="text-gray-400 text-sm">Não concluída</span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setSelectedStudent(null)
                    setDetailedProgress(null)
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students List */}
        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="text-gray-500 mt-4">Nenhum aluno matriculado ainda</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aluno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acesso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ width: '100px' }}>
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${student.progress.progressPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">
                          {student.progress.progressPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(student.progress.lastAccessedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openStudentDetails(student)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
