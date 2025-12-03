import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Navbar } from '../components/Navbar'

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // Redirecionar usuários autenticados para suas páginas apropriadas
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'instructor') {
        navigate('/instructor/dashboard')
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/courses')
      }
    }
  }, [isAuthenticated, user, navigate])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Bem-vindo à Plataforma EAD
          </h1>
          <p className="text-gray-600">
            Faça login para acessar os cursos
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Bem-vindo à Plataforma EAD
              </h2>
              <p className="text-gray-600">
                Use o menu acima para navegar pela plataforma
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
