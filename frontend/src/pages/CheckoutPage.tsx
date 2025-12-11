import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { PaymentMethodSelector } from '../components/PaymentMethodSelector'
import { CardPaymentForm } from '../components/CardPaymentForm'
import { PixPaymentForm } from '../components/PixPaymentForm'
import { PaymentComparison } from '../components/PaymentComparison'
import api from '../services/api'
import { Plan } from '../types'

interface PaymentConfig {
  maxInstallments: number
  pixDiscountPercent: number
  installmentsWithoutInterest: number
  pixExpirationMinutes: number
}

export const CheckoutPage = () => {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  // State management
  const [plan, setPlan] = useState<Plan | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'pix' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Subtask 10.3: Implementar busca de configurações
  // Task 11.1: Support plan data from route state (passed from SubscriptionRenewPage)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')

        // Check if plan data was passed via route state (from SubscriptionRenewPage)
        const statePlan = (location.state as any)?.plan
        
        if (statePlan) {
          // Use plan data from route state to avoid extra API call
          setPlan(statePlan)
        } else if (planId) {
          // Fetch plan details from API if not provided via state
          const planResponse = await api.get(`/subscriptions/plans/${planId}`)
          setPlan(planResponse.data.data || planResponse.data)
        }

        // Fetch payment configuration
        const configResponse = await api.get('/payments/config')
        setPaymentConfig(configResponse.data.data || configResponse.data)
      } catch (err: any) {
        console.error('Error fetching checkout data:', err)
        setError(err.response?.data?.error?.message || 'Erro ao carregar dados do checkout')
      } finally {
        setLoading(false)
      }
    }

    if (planId) {
      fetchData()
    } else {
      setError('ID do plano não fornecido')
      setLoading(false)
    }
  }, [planId, location.state])

  // Subtask 10.2: Integrar componentes de pagamento - Handle card payment
  const handleCardPayment = async (installments: number) => {
    if (!plan) return

    try {
      const response = await api.post('/payments/checkout', {
        planId: plan.id,
        paymentMethod: 'card',
        installments,
      })

      // Redirect to Stripe Checkout
      if (response.data.data?.checkoutUrl || response.data.checkoutUrl) {
        window.location.href = response.data.data?.checkoutUrl || response.data.checkoutUrl
      }
    } catch (err: any) {
      throw err
    }
  }

  // Subtask 10.2: Integrar componentes de pagamento - Handle PIX payment
  const handlePixPayment = async () => {
    // PIX payment generation is handled inside PixPaymentForm
    // This is just a callback for any additional logic
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
  }

  // Loading state
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

  // Error state
  if (error || !plan || !paymentConfig) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar checkout</h3>
                <p className="text-red-700">{error || 'Não foi possível carregar os dados do checkout'}</p>
                <button
                  onClick={() => navigate('/subscription/renew')}
                  className="mt-4 text-red-800 hover:text-red-900 font-medium underline"
                >
                  Voltar para seleção de planos
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Subtask 10.1: Implementar layout principal
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com informações do plano */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Finalizar Assinatura
          </h1>
          <p className="text-lg text-gray-600">
            Complete seu pagamento e comece a aprender agora
          </p>
        </div>

        {/* Layout principal: Desktop com sidebar, Mobile empilhado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área principal de pagamento - 2 colunas no desktop */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seção de seleção de método de pagamento */}
            <PaymentMethodSelector
              selectedMethod={selectedMethod}
              onSelectMethod={setSelectedMethod}
              pixDiscountPercent={paymentConfig.pixDiscountPercent}
            />

            {/* Comparação de métodos de pagamento */}
            {!selectedMethod && (
              <PaymentComparison
                plan={plan}
                pixDiscountPercent={paymentConfig.pixDiscountPercent}
                maxInstallments={paymentConfig.maxInstallments}
              />
            )}

            {/* Área para formulário de pagamento */}
            {selectedMethod === 'card' && (
              <CardPaymentForm
                plan={plan}
                maxInstallments={paymentConfig.maxInstallments}
                installmentsWithoutInterest={paymentConfig.installmentsWithoutInterest}
                onSubmit={handleCardPayment}
              />
            )}

            {selectedMethod === 'pix' && (
              <PixPaymentForm
                plan={plan}
                pixDiscountPercent={paymentConfig.pixDiscountPercent}
                onSubmit={handlePixPayment}
              />
            )}
          </div>

          {/* Resumo do pedido lateral (desktop) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Resumo do Pedido</h3>
              
              {/* Informações do plano */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plano selecionado</p>
                  <p className="text-lg font-semibold text-gray-900">{plan.name}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Valor do plano:</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                  </div>

                  {selectedMethod === 'pix' && (
                    <>
                      <div className="flex justify-between items-center mb-2 text-green-600">
                        <span>Desconto PIX ({paymentConfig.pixDiscountPercent}%):</span>
                        <span className="font-medium">
                          -{formatPrice(plan.price * (paymentConfig.pixDiscountPercent / 100), plan.currency)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Total:</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatPrice(plan.price * (1 - paymentConfig.pixDiscountPercent / 100), plan.currency)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedMethod === 'card' && (
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {!selectedMethod && (
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-1">Período: {plan.interval === 'monthly' ? 'Mensal' : 'Anual'}</p>
                  <p>Renovação automática</p>
                </div>
              </div>

              {/* Benefícios */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">O que está incluído:</p>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-gray-700">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Acesso ilimitado a todos os cursos</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Certificados de conclusão</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Novos cursos adicionados mensalmente</span>
                  </li>
                </ul>
              </div>

              {/* Security badge */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 mr-1 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Pagamento 100% seguro</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/subscription/renew')}
            className="text-gray-600 hover:text-gray-900 font-medium inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar para seleção de planos
          </button>
        </div>
      </div>
    </div>
  )
}
