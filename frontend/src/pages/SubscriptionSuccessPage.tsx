import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

export const SubscriptionSuccessPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { setUser } = useAuthStore()
  const [updating, setUpdating] = useState(true)

  useEffect(() => {
    // Atualizar dados do usuário para refletir a nova assinatura
    const updateUserData = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.data)
        setUpdating(false)
      } catch (error) {
        console.error('Erro ao atualizar dados do usuário:', error)
        setUpdating(false)
      }
    }

    updateUserData()

    // Redirecionar para cursos após 5 segundos
    const timer = setTimeout(() => {
      navigate('/courses')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate, setUser])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Assinatura Renovada com Sucesso!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Parabéns! Sua assinatura foi renovada e você já pode acessar todos os cursos da
            plataforma.
          </p>

          {/* Session Info */}
          {sessionId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-600">
                ID da Transação: <span className="font-mono text-gray-900">{sessionId}</span>
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Próximos Passos</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Você receberá um email de confirmação em breve</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Sua assinatura está ativa e você pode acessar todos os cursos</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Você será redirecionado automaticamente em 5 segundos</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium"
            >
              Ir para Cursos
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-md font-medium"
            >
              Ver Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
