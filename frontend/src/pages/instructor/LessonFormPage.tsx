import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import { LessonResourcesManager, LessonResource } from '../../components/LessonResourcesManager'
import api from '../../services/api'
import { Course, Module } from '../../types'

export const LessonFormPage = () => {
  const { id, moduleId, lessonId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    duration: 0,
    videoUrl: '',
    textContent: '',
  })
  
  const [resources, setResources] = useState<LessonResource[]>([])

  useEffect(() => {
    fetchData()
  }, [id, moduleId, lessonId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [courseRes, moduleRes] = await Promise.all([
        api.get<{ data: Course }>(`/courses/${id}`),
        api.get<{ data: Module }>(`/courses/modules/${moduleId}`),
      ])
      
      setCourse(courseRes.data.data)
      setModule(moduleRes.data.data)

      if (lessonId) {
        const lessonRes = await api.get<{ data: any }>(`/courses/lessons/${lessonId}`)
        const lesson = lessonRes.data.data
        
        // Converter text_content para string se for objeto
        let textContent = lesson.text_content || lesson.content || ''
        if (typeof textContent === 'object') {
          // Se for objeto EditorJS, extrair o texto dos blocos
          if (textContent.blocks && Array.isArray(textContent.blocks)) {
            textContent = textContent.blocks
              .map((block: any) => block.data?.text || '')
              .join('\n\n')
          } else {
            // Se for outro tipo de objeto, converter para string vazia
            textContent = ''
          }
        }

        // Mapear para o novo formato
        const formData: any = {
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration || 0,
          videoUrl: lesson.video_url || '',
          textContent: textContent,
        }

        // Fallback para formato antigo (compatibilidade)
        if (!formData.videoUrl && lesson.type === 'video') {
          formData.videoUrl = lesson.content
        }

        console.log('📋 Setando lessonForm com textContent:', formData.textContent)
        setLessonForm(formData)
        
        // Carregar recursos da aula
        try {
          const resourcesRes = await api.get(`/courses/lessons/${lessonId}/resources`)
          setResources(resourcesRes.data.data || [])
        } catch (err) {
          console.error('Erro ao carregar recursos:', err)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')

      // Verificar se pelo menos um conteúdo foi preenchido
      const hasContent = lessonForm.videoUrl || lessonForm.textContent || resources.length > 0

      if (!hasContent) {
        setError('Por favor, adicione pelo menos um tipo de conteúdo (vídeo, texto ou recursos)')
        setSaving(false)
        return
      }

      // Log para debug
      console.log('💾 Salvando aula:');
      console.log('  - textContent no estado:', lessonForm.textContent);
      console.log('  - videoUrl:', lessonForm.videoUrl);
      console.log('  - recursos:', resources.length);

      // Preparar payload com TODOS os conteúdos preenchidos
      const payload = {
        title: lessonForm.title,
        description: lessonForm.description,
        duration: lessonForm.duration,
        video_url: lessonForm.videoUrl || null,
        text_content: lessonForm.textContent || null,
      }

      let savedLessonId = lessonId
      
      if (lessonId) {
        console.log('📝 Atualizando aula existente:', lessonId);
        await api.patch(`/courses/lessons/${lessonId}`, payload)
      } else {
        console.log('➕ Criando nova aula');
        const response = await api.post(`/courses/modules/${moduleId}/lessons`, payload)
        console.log('✅ Resposta da criação:', response.data);
        // O backend retorna { message, data: lesson }
        savedLessonId = response.data.data.id
        console.log('🆔 ID da aula criada:', savedLessonId);
      }

      // Salvar apenas recursos NOVOS (que não têm id)
      const newResources = resources.filter(r => !r.id);
      console.log('📎 Recursos totais:', resources.length, '| Novos:', newResources.length);
      
      if (newResources.length > 0 && savedLessonId) {
        console.log(`📤 Enviando ${newResources.length} recursos novos para aula ${savedLessonId}`);
        const resourcesResponse = await api.post(`/courses/lessons/${savedLessonId}/resources`, { resources: newResources });
        console.log('✅ Recursos salvos:', resourcesResponse.data);
      } else {
        console.log('⚠️ Nenhum recurso novo para salvar');
      }

      navigate(`/instructor/courses/${id}/modules`)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao salvar aula')
    } finally {
      setSaving(false)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(`/instructor/courses/${id}/modules`)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Voltar para módulos
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {lessonId ? 'Editar Aula' : 'Nova Aula'}
          </h1>
          <p className="text-gray-600 mt-2">
            {course?.title} Módulo: {module?.title}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Aula *
                </label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Introdução ao React"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva o conteúdo da aula..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração Estimada (minutos)
                </label>
                <input
                  type="number"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 30"
                />
              </div>
            </div>
          </div>

          {/* Seção de Vídeo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🎥</span>
              <h2 className="text-xl font-semibold text-gray-900">Vídeo da Aula</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link do Vídeo (YouTube, Vimeo, etc.)
              </label>
              <input
                type="url"
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Cole a URL do vídeo hospedado no YouTube, Vimeo ou outra plataforma
              </p>
            </div>
          </div>

          {/* Seção de Texto */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">📝</span>
              <h2 className="text-xl font-semibold text-gray-900">Conteúdo em Texto</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto da Aula
              </label>
              <textarea
                value={lessonForm.textContent}
                onChange={(e) => setLessonForm({ ...lessonForm, textContent: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite o conteúdo da aula..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Digite o conteúdo textual da aula
              </p>
            </div>
          </div>

          {/* Seção de Recursos (Imagens, PDFs, Vídeos, Links) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">??</span>
              <h2 className="text-xl font-semibold text-gray-900">Recursos da Aula</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Adicione imagens, PDFs, vídeos ou links externos como materiais complementares
            </p>
            
            <LessonResourcesManager
              lessonId={lessonId}
              resources={resources}
              onChange={setResources}
            />
          </div>

          {/* Botões de Ação */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/instructor/courses/${id}/modules`)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Salvando...' : lessonId ? 'Atualizar Aula' : 'Criar Aula'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
