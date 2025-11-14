import { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import { CourseCard } from '../components/CourseCard'
import api from '../services/api'
import { StudentProgress, Course } from '../types'
import { useAuth } from '../contexts/AuthContext'

export const MyCoursesPage = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'favorites'>('all')

  useEffect(() => {
    if (user) {
      fetchMyCourses()
    }
  }, [user])

  const fetchMyCourses = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('Fetching courses for user:', user.role)
      
      // Instrutor: buscar cursos criados
      if (user.role === 'instructor') {
        console.log('Calling /instructor/courses')
        const response = await api.get<{ data: { courses: Course[] } }>('/instructor/courses')
        console.log('Response:', response.data)
        setCourses(response.data.data.courses || [])
      } 
      // Aluno: buscar cursos com progresso
      else {
        console.log('Calling /students/courses/progress')
        const response = await api.get<{ data: StudentProgress[] }>('/students/courses/progress')
        console.log('Response:', response.data)
        setCourses(response.data.data || [])
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err)
      setError(err.response?.data?.error?.message || 'Erro ao carregar cursos')
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter((item) => {
    // Para instrutores, filtrar por status do curso
    if (user?.role === 'instructor') {
      if (filter === 'in_progress') {
        return item.status === 'draft' || item.status === 'pending_approval'
      }
      if (filter === 'completed') {
        return item.status === 'published'
      }
      if (filter === 'favorites') {
        return false // Instrutores não têm favoritos
      }
      return true
    }
    
    // Para alunos, filtrar por progresso
    if (filter === 'in_progress') {
      return item.progressPercentage > 0 && item.progressPercentage < 100
    }
    if (filter === 'completed') {
      return item.progressPercentage === 100
    }
    if (filter === 'favorites') {
      return item.isFavorite
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Meus Cursos</h1>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Todos ({courses.length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {user?.role === 'instructor' ? 'Em Edição' : 'Em Progresso'} (
              {user?.role === 'instructor'
                ? courses.filter((c) => c.status === 'draft' || c.status === 'pending_approval').length
                : courses.filter((c) => c.progressPercentage > 0 && c.progressPercentage < 100).length}
              )
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {user?.role === 'instructor' ? 'Publicados' : 'Concluídos'} (
              {user?.role === 'instructor'
                ? courses.filter((c) => c.status === 'published').length
                : courses.filter((c) => c.progressPercentage === 100).length}
              )
            </button>
            {user?.role !== 'instructor' && (
              <button
                onClick={() => setFilter('favorites')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === 'favorites'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Favoritos ({courses.filter((c) => c.isFavorite).length})
              </button>
            )}
          </div>
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
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto mb-4"
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
            <p className="text-gray-500 text-lg mb-4">
              {user?.role === 'instructor'
                ? filter === 'all'
                  ? 'Você ainda não criou nenhum curso'
                  : filter === 'completed'
                  ? 'Nenhum curso publicado'
                  : 'Nenhum curso em edição'
                : filter === 'all'
                ? 'Você ainda não iniciou nenhum curso'
                : filter === 'favorites'
                ? 'Você não tem cursos favoritos'
                : `Nenhum curso ${filter === 'completed' ? 'concluído' : 'em progresso'}`}
            </p>
            {filter === 'all' && user?.role === 'instructor' && (
              <a
                href="/instructor/courses/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Criar Novo Curso
              </a>
            )}
            {filter === 'all' && user?.role !== 'instructor' && (
              <a
                href="/courses"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Explorar Cursos
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((item) => (
              <CourseCard
                key={item.id || item.courseId}
                course={user?.role === 'instructor' ? item : item.course!}
                progress={user?.role === 'instructor' ? undefined : item.progressPercentage}
                showProgress={user?.role !== 'instructor'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
