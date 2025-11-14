import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import api from '../../services/api'
import { StudentAssessment } from '../../types'

export const GradingPage = () => {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<StudentAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<StudentAssessment | null>(null)
  const [gradeForm, setGradeForm] = useState({
    score: 0,
    feedback: '',
  })

  useEffect(() => {
    fetchPendingSubmissions()
  }, [])

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ data: StudentAssessment[] }>('/instructor/assessments/pending')
      setSubmissions(response.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission) return

    try {
      await api.patch(`/student-assessments/${selectedSubmission.id}/grade`, gradeForm)
      setSelectedSubmission(null)
      setGradeForm({ score: 0, feedback: '' })
      fetchPendingSubmissions()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao atribuir nota')
    }
  }

  const openGradeModal = (submission: StudentAssessment) => {
    setSelectedSubmission(submission)
    setGradeForm({ score: 0, feedback: '' })
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
          <h1 className="text-3xl font-bold text-gray-900">Avaliações Pendentes de Correção</h1>
          <p className="text-gray-600 mt-2">
            {submissions.length} {submissions.length === 1 ? 'avaliação pendente' : 'avaliações pendentes'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Grade Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Corrigir Avaliação</h2>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">Avaliação</p>
                <p className="font-medium text-gray-900">{selectedSubmission.assessment?.title}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Submetida em: {new Date(selectedSubmission.submittedAt).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Respostas do Aluno</h3>
                <div className="space-y-4">
                  {selectedSubmission.answers.map((answer, index) => {
                    const question = selectedSubmission.assessment?.questions.find(
                      (q) => q.id === answer.questionId
                    )
                    return (
                      <div key={index} className="p-4 border border-gray-200 rounded-md">
                        <p className="font-medium text-gray-900 mb-2">
                          {index + 1}. {question?.text}
                        </p>
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Resposta:</span> {answer.answer}
                          </p>
                        </div>
                        {question?.type === 'multiple_choice' && question.options && (
                          <p className="text-sm text-gray-600 mt-2">
                            Resposta correta: {question.options[question.correctAnswer || 0]}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nota (0-100) *
                  </label>
                  <input
                    type="number"
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: parseInt(e.target.value) })}
                    required
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (opcional)
                  </label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Deixe um comentário para o aluno..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Atribuir Nota
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submissions List */}
        {submissions.length === 0 ? (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 mt-4">Nenhuma avaliação pendente de correção</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avaliação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aluno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Submissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.assessment?.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{submission.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(submission.submittedAt).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openGradeModal(submission)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Corrigir
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
