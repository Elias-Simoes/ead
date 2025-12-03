import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
  description?: string
}

export const SubscriptionRenewPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      console.log('🔍 Buscando planos...')
      const response = await api.get('/subscriptions/plans')
      console.log('✅ Planos recebidos:', response.data)
      setPlans(response.data)
    } catch (err: any) {
      console.error('❌ Erro ao buscar planos:', err)
      console.error('Resposta do erro:', err.response?.data)
      setError(err.response?.data?.error?.message || 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const handleRenewSubscription = async (planId: string) => {
    try {
      setProcessingPlanId(planId)
      setError('')

      const response = await api.post('/subscriptions/renew', { planId })
      
      // Redirecionar para o checkout do Stripe
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao processar renovação')
      setProcessingPlanId(null)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
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
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Renovar Assinatura</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Escolha um plano para renovar sua assinatura e continuar acessando todos os cursos da
            plataforma
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        {user?.subscriptionStatus && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">
                    Status Atual da Assinatura
                  </h3>
                  <p className="text-yellow-700">
                    Sua assinatura está{' '}
                    <span className="font-semibold">
                      {user.subscriptionStatus === 'inactive'
                        ? 'inativa'
                        : user.subscriptionStatus === 'cancelled'
                        ? 'cancelada'
                        : 'expirada'}
                    </span>
                    . Escolha um plano abaixo para renovar e voltar a ter acesso completo aos
                    cursos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-12">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Nenhum plano disponível
            </h3>
            <p className="text-gray-600 mb-6">
              Não há planos disponíveis no momento. Entre em contato com o suporte.
            </p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-blue-600">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-gray-600">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                  </div>
                  {plan.description && (
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                  )}
                  <button
                    onClick={() => handleRenewSubscription(plan.id)}
                    disabled={processingPlanId === plan.id}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {processingPlanId === plan.id ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processando...
                      </>
                    ) : (
                      <>
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Renovar com este Plano
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Como funciona a renovação?
            </h3>
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
                <span>Escolha o plano que melhor se adequa às suas necessidades</span>
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
                <span>Você será redirecionado para o checkout seguro do Stripe</span>
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
                <span>Complete o pagamento com cartão de crédito</span>
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
                <span>Sua assinatura será ativada imediatamente após a confirmação</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Back Button */}
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <button
            onClick={() => navigate('/profile')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Voltar para o Perfil
          </button>
        </div>
      </div>
    </div>
  )
}
