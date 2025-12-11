import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { CourseCard } from '../components/CourseCard'
import { SubscriptionWarning } from '../components/SubscriptionWarning'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import { Course } from '../types'

export const CoursesPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Verificar se o usuário tem assinatura ativa ou expirada
  const isExpiredSubscription = user?.role === 'student' && 
    (user?.subscriptionStatus === 'inactive' || user?.subscriptionStatus === 'cancelled')
  
  // Verificar se é um usuário novo (nunca teve assinatura) ou se já teve assinatura
  const isNewUser = user?.role === 'student' && user?.subscriptionStatus === 'inactive' && !user?.subscriptionExpiresAt

  useEffect(() => {
    console.log('CoursesPage montado')
    fetchCourses()
  }, [page, searchTerm, selectedCategory])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError('') // Limpar erro anterior
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      if (selectedCategory) {
        params.append('category', selectedCategory)
      }

      console.log('Buscando cursos...', `/courses?${params}`)
      const response = await api.get(`/courses?${params}`)
      console.log('Resposta da API:', response.data)
      
      // Verificar estrutura da resposta - pode ser data.data.courses ou data.data
      let coursesData: Course[] = []
      if (response.data.data) {
        if (Array.isArray(response.data.data.courses)) {
          coursesData = response.data.data.courses
        } else if (Array.isArray(response.data.data)) {
          coursesData = response.data.data
        }
      }
      
      const total = response.data.totalPages || response.data.data?.totalPages || 1
      
      setCourses(coursesData)
      setTotalPages(total)

      // Extract unique categories
      if (Array.isArray(coursesData) && coursesData.length > 0) {
        const uniqueCategories = Array.from(
          new Set(coursesData.map((course) => course.category).filter(Boolean))
        )
        setCategories(uniqueCategories)
      }
    } catch (err: any) {
      console.error('Erro ao buscar cursos:', err)
      setError(err.response?.data?.error?.message || 'Erro ao carregar cursos')
      setCourses([]) // Garantir que courses seja um array vazio em caso de erro
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCourses()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cursos Disponíveis</h1>

        {/* Subscription Warning */}
        <SubscriptionWarning />

        {/* Bloqueio para assinatura expirada */}
        {isExpiredSubscription && (
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl shadow-xl mb-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            
            <div className="relative p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center">
                {/* Icon Section */}
                

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  <div className="mb-4">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {isNewUser ? '🚀 Comece Sua Jornada de Aprendizado!' : '⚠️ Acesso aos Cursos Bloqueado'}
                    </h3>
                    <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-700 text-lg leading-relaxed mb-4">
                      {isNewUser 
                        ? 'Bem-vindo à nossa plataforma! Para acessar nossos cursos exclusivos e começar a transformar sua carreira, você precisa escolher um plano que se adeque às suas necessidades.'
                        : user?.subscriptionStatus === 'cancelled' 
                          ? 'Sua assinatura foi cancelada. Para voltar a acessar nossos cursos e continuar seu desenvolvimento, renove sua assinatura agora.'
                          : 'Sua assinatura expirou. Para continuar acessando nossos cursos e manter seu progresso, renove sua assinatura.'
                      }
                    </p>
                    
                    {isNewUser && (
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h4 className="font-semibold text-gray-900">O que você terá acesso:</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>Cursos completos e atualizados</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>Avaliações e certificados</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>Suporte especializado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>Acesso vitalício ao conteúdo</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => navigate(isNewUser ? '/plans' : '/subscription/renew')}
                      className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={isNewUser 
                            ? "M12 6v6m0 0v6m0-6h6m-6 0H6" 
                            : "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          }
                        />
                      </svg>
                      <span className="relative">
                        {isNewUser ? '✨ Escolher Meu Plano' : '🔄 Renovar Assinatura'}
                      </span>
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => navigate('/profile')}
                      className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 px-8 py-4 rounded-xl font-medium text-lg shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Ver Meu Perfil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mostrar conteúdo apenas se não for assinatura expirada */}
        {!isExpiredSubscription && (
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Buscar
                </button>
              </form>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {searchTerm || selectedCategory
                ? 'Nenhum curso encontrado'
                : 'Ainda não há cursos disponíveis'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || selectedCategory
                ? 'Tente ajustar seus filtros de busca ou explorar outras categorias.'
                : 'Novos cursos serão adicionados em breve. Volte mais tarde para conferir!'}
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('')
                  setPage(1)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center"
              >
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
          </>
        )}
      </div>
    </div>
  )
}
