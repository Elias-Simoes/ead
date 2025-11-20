import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import api from '../../services/api'
import { Course, Assessment } from '../../types'

export const AssessmentsManagementPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)

  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    type: 'multiple_choice' as 'multiple_choice' | 'essay',
    passingScore: 70,
  })

  const [questionForm, setQuestionForm] = useState({
    text: '',
    type: 'multiple_choice' as 'multiple_choice' | 'essay',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
  })

  useEffect(() => {
    fetchCourseAndAssessments()
  }, [id])

  const fetchCourseAndAssessments = async () => {
    try {
      setLoading(true)
      const [courseRes, assessmentsRes] = await Promise.all([
        api.get<{ data: Course }>(`/courses/${id}`),
        api.get<{ data: Assessment[] }>(`/courses/${id}/assessments`),
      ])
      setCourse(courseRes.data.data)
      setAssessments(assessmentsRes.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post(`/courses/${id}/assessments`, assessmentForm)
      setShowAssessmentForm(false)
      setAssessmentForm({ title: '', type: 'multiple_choice', passingScore: 70 })
      fetchCourseAndAssessments()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao criar avaliação')
    }
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const questionData = {
        ...questionForm,
        options: questionForm.type === 'multiple_choice' ? questionForm.options.filter(o => o.trim()) : undefined,
        correctAnswer: questionForm.type === 'multiple_choice' ? questionForm.correctAnswer : undefined,
      }
      await api.post(`/assessments/${selectedAssessmentId}/questions`, questionData)
      setShowQuestionForm(false)
      setSelectedAssessmentId(null)
      setQuestionForm({
        text: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 10,
      })
      fetchCourseAndAssessments()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao adicionar questão')
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return
    try {
      await api.delete(`/assessments/${assessmentId}`)
      fetchCourseAndAssessments()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao excluir avaliação')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return
    try {
      await api.delete(`/questions/${questionId}`)
      fetchCourseAndAssessments()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao excluir questão')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(`/instructor/courses/${id}`)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Voltar para o curso
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
          <p className="text-gray-600 mt-2">Gerenciar Avaliações</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => navigate(`/instructor/courses/${id}/assessments/new`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            + Criar Avaliação
          </button>
        </div>

        {/* Assessment Form Modal */}
        {showAssessmentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Nova Avaliação</h2>
              <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={assessmentForm.title}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={assessmentForm.type}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="multiple_choice">Múltipla Escolha</option>
                    <option value="essay">Dissertativa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nota Mínima para Aprovação (%) *
                  </label>
                  <input
                    type="number"
                    value={assessmentForm.passingScore}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, passingScore: parseInt(e.target.value) })}
                    required
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAssessmentForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Criar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Question Form Modal */}
        {showQuestionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Nova Questão</h2>
              <form onSubmit={handleQuestionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pergunta *
                  </label>
                  <textarea
                    value={questionForm.text}
                    onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="multiple_choice">Múltipla Escolha</option>
                    <option value="essay">Dissertativa</option>
                  </select>
                </div>

                {questionForm.type === 'multiple_choice' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opções *
                      </label>
                      {questionForm.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={questionForm.correctAnswer === index}
                            onChange={() => setQuestionForm({ ...questionForm, correctAnswer: index })}
                            className="h-4 w-4 text-blue-600"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...questionForm.options]
                              newOptions[index] = e.target.value
                              setQuestionForm({ ...questionForm, options: newOptions })
                            }}
                            placeholder={`Opção ${index + 1}`}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      ))}
                      <p className="text-sm text-gray-500 mt-2">
                        Selecione a opção correta marcando o círculo
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pontos *
                  </label>
                  <input
                    type="number"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionForm(false)
                      setSelectedAssessmentId(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assessments List */}
        <div className="space-y-6">
          {assessments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">
                Nenhuma avaliação criada ainda. Crie a primeira avaliação!
              </p>
            </div>
          ) : (
            assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{assessment.title}</h3>
                    <p className="text-gray-600 mt-1">
                      Tipo: {assessment.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Dissertativa'} •
                      Nota Mínima: {assessment.passingScore}%
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/instructor/courses/${id}/assessments/${assessment.id}/edit`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedAssessmentId(assessment.id)
                    setShowQuestionForm(true)
                  }}
                  className="mb-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Adicionar Questão
                </button>

                {assessment.questions && assessment.questions.length > 0 ? (
                  <div className="space-y-3">
                    {assessment.questions.map((question, index) => (
                      <div key={question.id} className="p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {index + 1}. {question.text}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {question.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Dissertativa'} •
                              {question.points} pontos
                            </p>
                            {question.options && (
                              <div className="mt-2 space-y-1">
                                {question.options.map((option, optIndex) => (
                                  <p
                                    key={optIndex}
                                    className={`text-sm ${
                                      optIndex === question.correctAnswer
                                        ? 'text-green-600 font-medium'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIndex)}) {option}
                                    {optIndex === question.correctAnswer && ' ✓'}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-800 text-sm ml-4"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma questão adicionada ainda</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
