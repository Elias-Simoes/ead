import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import api from '../../services/api'
import { Course, Module, Lesson } from '../../types'

export const ModulesManagementPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
  })

  useEffect(() => {
    fetchCourseAndModules()
  }, [id])

  const fetchCourseAndModules = async () => {
    try {
      setLoading(true)
      const [courseRes, modulesRes] = await Promise.all([
        api.get<{ data: Course }>(`/courses/${id}`),
        api.get<{ data: Module[] }>(`/courses/${id}/modules`),
      ])
      setCourse(courseRes.data.data)
      setModules(modulesRes.data.data)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingModule) {
        await api.patch(`/courses/modules/${editingModule.id}`, moduleForm)
      } else {
        await api.post(`/courses/${id}/modules`, moduleForm)
      }
      setShowModuleForm(false)
      setEditingModule(null)
      setModuleForm({ title: '', description: '' })
      fetchCourseAndModules()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao salvar módulo')
    }
  }



  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este módulo?')) return
    try {
      await api.delete(`/courses/modules/${moduleId}`)
      fetchCourseAndModules()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao excluir módulo')
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) return
    try {
      await api.delete(`/courses/lessons/${lessonId}`)
      fetchCourseAndModules()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao excluir aula')
    }
  }

  const openEditModule = (module: Module) => {
    setEditingModule(module)
    setModuleForm({ title: module.title, description: module.description })
    setShowModuleForm(true)
  }

  const openEditLesson = (lesson: Lesson, moduleId: string) => {
    navigate(`/instructor/courses/${id}/modules/${moduleId}/lessons/${lesson.id}`)
  }

  const openAddLesson = (moduleId: string) => {
    navigate(`/instructor/courses/${id}/modules/${moduleId}/lessons/new`)
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
          <p className="text-gray-600 mt-2">Gerenciar Módulos e Aulas</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => {
              setEditingModule(null)
              setModuleForm({ title: '', description: '' })
              setShowModuleForm(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            + Adicionar Módulo
          </button>
        </div>

        {/* Module Form Modal */}
        {showModuleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">
                {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
              </h2>
              <form onSubmit={handleModuleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModuleForm(false)
                      setEditingModule(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* Modules List */}
        <div className="space-y-6">
          {modules.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">
                Nenhum módulo criado ainda. Adicione o primeiro módulo para começar!
              </p>
            </div>
          ) : (
            modules.map((module, index) => (
              <div key={module.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Módulo {index + 1}: {module.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{module.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModule(module)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => openAddLesson(module.id)}
                  className="mb-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Adicionar Aula
                </button>

                {module.lessons && module.lessons.length > 0 ? (
                  <div className="space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {lessonIndex + 1}. {lesson.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {lesson.type === 'video' && '🎥 Vídeo'}
                            {lesson.type === 'pdf' && '📄 PDF'}
                            {lesson.type === 'text' && '📝 Texto'}
                            {lesson.type === 'external_link' && '🔗 Link Externo'}
                            {lesson.duration && ` • ${lesson.duration} min`}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditLesson(lesson, module.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Nenhuma aula adicionada ainda</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
