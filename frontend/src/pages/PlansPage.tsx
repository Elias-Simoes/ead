import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import api from '../services/api'

interface Plan {
  id: string
  name: string
  price: string
  interval: string
  is_active: boolean
  currency?: string
}

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await api.get('/subscriptions/plans')
      // A resposta vem diretamente em response.data como array
      setPlans(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar planos:', err)
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (planId: string) => {
    navigate(`/checkout/${planId}`)
  }

  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    }
    return labels[interval] || interval
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando planos...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Escolha seu Plano
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Acesso ilimitado a todos os cursos da plataforma
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Plano {getIntervalLabel(plan.interval)}
                  </p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">
                      R$ {parseFloat(plan.price).toFixed(2)}
                    </span>
                    <span className="text-gray-600">
                      /{plan.interval === 'monthly' ? 'mês' : plan.interval === 'quarterly' ? 'trimestre' : 'ano'}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Acesso a todos os cursos</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Certificados de conclusão</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Suporte prioritário</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">Atualizações gratuitas</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Assinar Agora
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Todas as assinaturas incluem garantia de 7 dias. Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
