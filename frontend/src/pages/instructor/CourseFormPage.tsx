import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import api from '../../services/api'
import { Course } from '../../types'

export const CourseFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    workload: 0,
    coverImage: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    if (isEdit) {
      fetchCourse()
    }
  }, [id])

  const fetchCourse = async () => {
    try {
      const response = await api.get<{ data: Course }>(`/courses/${id}`)
      const course = response.data.data
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        workload: course.workload,
        coverImage: course.coverImage,
      })
      setImagePreview(course.coverImage)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar curso')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let coverImageUrl = formData.coverImage

      // Upload image if a new one was selected
      if (imageFile) {
        try {
          const imageFormData = new FormData()
          imageFormData.append('file', imageFile)
          imageFormData.append('folder', 'courses')
          
          const uploadResponse = await api.post('/upload', imageFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          coverImageUrl = uploadResponse.data.data.url
        } catch (uploadErr: any) {
          console.error('Erro ao fazer upload da imagem:', uploadErr)
          setError('Erro ao fazer upload da imagem. Tente novamente.')
          setLoading(false)
          return
        }
      }

      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        workload: formData.workload,
        coverImage: coverImageUrl || null,
      }

      if (isEdit) {
        await api.patch(`/courses/${id}`, courseData)
        setSuccess('Curso atualizado com sucesso!')
      } else {
        const response = await api.post('/courses', courseData)
        const courseId = response.data.data?.course?.id || response.data.data?.id || response.data.id
        setSuccess('Curso criado com sucesso!')
        setTimeout(() => {
          navigate(`/instructor/courses/${courseId}/modules`)
        }, 1500)
      }
    } catch (err: any) {
      console.error('Erro completo:', err)
      setError(err.response?.data?.error?.message || err.message || 'Erro ao salvar curso')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'workload' ? parseInt(value) || 0 : value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Curso' : 'Criar Novo Curso'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Atualize as informações do seu curso' : 'Preencha as informações básicas do curso'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título do Curso *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Introdução ao JavaScript"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva o conteúdo e objetivos do curso..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma categoria</option>
                <option value="Programação">Programação</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Negócios">Negócios</option>
                <option value="Idiomas">Idiomas</option>
                <option value="Desenvolvimento Pessoal">Desenvolvimento Pessoal</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label htmlFor="workload" className="block text-sm font-medium text-gray-700 mb-2">
                Carga Horária (horas) *
              </label>
              <input
                type="number"
                id="workload"
                name="workload"
                value={formData.workload}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
              Imagem de Capa
            </label>
            <input
              type="file"
              id="coverImage"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Selecione uma imagem (JPG, PNG, GIF, WebP)
            </p>
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/instructor/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
            >
              {loading ? 'Salvando...' : isEdit ? 'Atualizar Curso' : 'Criar Curso'}
            </button>
          </div>
        </form>

        {isEdit && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Próximos Passos</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/instructor/courses/${id}/modules`)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition"
              >
                <span className="font-medium text-gray-900">Gerenciar Módulos e Aulas</span>
                <p className="text-sm text-gray-600">Adicione e organize o conteúdo do curso</p>
              </button>
              <button
                onClick={() => navigate(`/instructor/courses/${id}/assessments`)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition"
              >
                <span className="font-medium text-gray-900">Criar Avaliações</span>
                <p className="text-sm text-gray-600">Adicione testes e avaliações ao curso</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
