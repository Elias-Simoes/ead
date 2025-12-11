import React, { useState, useEffect, useRef } from 'react'
import { Plan } from '../types'
import api from '../services/api'

interface PixPaymentFormProps {
  plan: Plan
  pixDiscountPercent: number
  onSubmit: () => Promise<void>
}

interface PixPaymentData {
  paymentId: string
  qrCode: string
  qrCodeBase64: string
  copyPasteCode: string
  expiresAt: string
  amount: number
  discount: number
}

export const PixPaymentForm: React.FC<PixPaymentFormProps> = ({
  plan,
  pixDiscountPercent,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [pixData, setPixData] = useState<PixPaymentData | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending')
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingAttemptsRef = useRef<number>(0)

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
  }

  const calculateDiscount = () => {
    return plan.price * (pixDiscountPercent / 100)
  }

  const calculateFinalPrice = () => {
    return plan.price - calculateDiscount()
  }

  // Subtask 9.1: Implementar exibição de valor com desconto
  // Subtask 9.2: Implementar geração e exibição de QR Code
  const generatePixPayment = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await api.post('/payments/checkout', {
        planId: plan.id,
        paymentMethod: 'pix',
      })

      const data = response.data.data
      setPixData({
        paymentId: data.paymentId,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        copyPasteCode: data.copyPasteCode,
        expiresAt: data.expiresAt,
        amount: data.amount,
        discount: data.discount || 0,
      })

      // Calculate initial time remaining
      const expiresAt = new Date(data.expiresAt).getTime()
      const now = Date.now()
      setTimeRemaining(Math.max(0, Math.floor((expiresAt - now) / 1000)))

      await onSubmit()
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao gerar pagamento PIX')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (!pixData) return

    try {
      await navigator.clipboard.writeText(pixData.copyPasteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      setError('Erro ao copiar código')
    }
  }

  // Subtask 9.3: Implementar timer de expiração
  useEffect(() => {
    if (!pixData || paymentStatus !== 'pending') return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setPaymentStatus('expired')
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [pixData, paymentStatus])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isExpiringSoon = () => {
    return timeRemaining > 0 && timeRemaining <= 300 // 5 minutes
  }

  const handleGenerateNewQRCode = async () => {
    setPixData(null)
    setPaymentStatus('pending')
    setTimeRemaining(0)
    await generatePixPayment()
  }

  // Subtask 9.4: Implementar polling de status
  const checkPaymentStatus = async () => {
    if (!pixData || paymentStatus !== 'pending') return

    try {
      const response = await api.get(`/payments/pix/${pixData.paymentId}/status`)
      const status = response.data.data.status

      if (status === 'paid') {
        setPaymentStatus('paid')
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        // Redirect to success page
        setTimeout(() => {
          window.location.href = '/subscription/success'
        }, 2000)
      } else if (status === 'expired') {
        setPaymentStatus('expired')
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
      }
    } catch (err) {
      console.error('Error checking payment status:', err)
    }
  }

  const getPollingInterval = () => {
    const attempts = pollingAttemptsRef.current
    
    // First minute: every 3 seconds
    if (attempts < 20) {
      return 3000
    }
    // After 1 minute: exponential backoff
    // 2-3 minutes: 6 seconds
    if (attempts < 40) {
      return 6000
    }
    // 3-5 minutes: 10 seconds
    if (attempts < 60) {
      return 10000
    }
    // After 5 minutes: 15 seconds
    return 15000
  }

  useEffect(() => {
    if (!pixData || paymentStatus !== 'pending') {
      // Clean up polling when not needed
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      pollingAttemptsRef.current = 0
      return
    }

    // Start polling
    const startPolling = () => {
      // Initial check
      checkPaymentStatus()

      const poll = () => {
        pollingAttemptsRef.current += 1
        checkPaymentStatus()

        // Clear current interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }

        // Set new interval with updated timing
        const interval = getPollingInterval()
        pollingIntervalRef.current = setInterval(() => {
          pollingAttemptsRef.current += 1
          checkPaymentStatus()
        }, interval)
      }

      // Start with initial interval
      pollingIntervalRef.current = setInterval(poll, 3000)
    }

    startPolling()

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [pixData, paymentStatus])

  const renderExpirationTimer = () => {
    if (!pixData || paymentStatus !== 'pending') return null

    return (
      <div className={`rounded-lg p-4 mb-6 ${
        isExpiringSoon() ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className={`w-5 h-5 mr-2 ${isExpiringSoon() ? 'text-amber-600' : 'text-gray-600'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span className={`text-sm font-medium ${
              isExpiringSoon() ? 'text-amber-800' : 'text-gray-700'
            }`}>
              {isExpiringSoon() ? 'Atenção: Tempo expirando!' : 'Tempo restante:'}
            </span>
          </div>
          <span className={`text-lg font-bold ${
            isExpiringSoon() ? 'text-amber-600' : 'text-gray-900'
          }`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        {isExpiringSoon() && (
          <p className="text-xs text-amber-700 mt-2">
            Complete o pagamento antes que o QR Code expire
          </p>
        )}
      </div>
    )
  }

  const renderExpiredState = () => {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg
            className="w-16 h-16 text-red-600 mx-auto mb-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-xl font-bold text-red-900 mb-2">QR Code Expirado</h3>
          <p className="text-red-700 mb-6">
            O tempo para pagamento expirou. Gere um novo QR Code para continuar.
          </p>
          <button
            onClick={handleGenerateNewQRCode}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            {loading ? 'Gerando...' : 'Gerar Novo QR Code'}
          </button>
        </div>
      </div>
    )
  }

  const renderPaidState = () => {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg
            className="w-16 h-16 text-green-600 mx-auto mb-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-xl font-bold text-green-900 mb-2">Pagamento Confirmado!</h3>
          <p className="text-green-700 mb-4">
            Seu pagamento foi confirmado com sucesso. Redirecionando...
          </p>
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-green-600"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  const renderPollingIndicator = () => {
    if (!pixData || paymentStatus !== 'pending') return null

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg
            className="animate-spin h-5 w-5 text-blue-600 mr-3"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900">Aguardando Pagamento</p>
            <p className="text-xs text-blue-700">
              Verificando automaticamente... Não feche esta página.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderPriceDisplay = () => {
    const originalPrice = plan.price
    const discount = calculateDiscount()
    const finalPrice = calculateFinalPrice()

    return (
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Valor do plano</p>
          
          {/* Valor original riscado */}
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl text-gray-500 line-through">
              {formatPrice(originalPrice, plan.currency)}
            </span>
          </div>

          {/* Valor com desconto em verde */}
          <div className="flex items-center justify-center mb-3">
            <span className="text-4xl font-bold text-green-600">
              {formatPrice(finalPrice, plan.currency)}
            </span>
          </div>

          {/* Percentual de economia */}
          <div className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded-full">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">
              Economize {formatPrice(discount, plan.currency)} ({pixDiscountPercent}%)
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-3">
            Pagamento à vista via PIX
          </p>
        </div>
      </div>
    )
  }

  // Subtask 9.5: Implementar UI responsiva para mobile
  const openBankApp = () => {
    if (!pixData) return
    
    // Try to open PIX payment in bank app (works on mobile)
    const pixUrl = `pix://qr?data=${encodeURIComponent(pixData.copyPasteCode)}`
    window.location.href = pixUrl
  }

  const renderQRCode = () => {
    if (!pixData) return null

    return (
      <div className="space-y-4 md:space-y-6">
        {/* QR Code Display */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-6">
          {/* Desktop: Show QR Code prominently */}
          <div className="hidden md:block">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Escaneie o QR Code
              </h4>
              <p className="text-sm text-gray-600">
                Use o app do seu banco para escanear
              </p>
            </div>

            {/* QR Code Image */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                <img
                  src={pixData.qrCodeBase64}
                  alt="QR Code PIX"
                  className="w-80 h-80"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>
          </div>

          {/* Mobile: Prioritize copy button and bank app */}
          <div className="md:hidden mb-4">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Pague com PIX
              </h4>
              <p className="text-sm text-gray-600">
                Copie o código ou abra no app do banco
              </p>
            </div>

            {/* Mobile: Open Bank App Button (Priority) */}
            <button
              onClick={openBankApp}
              className="w-full py-4 px-4 mb-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg"
            >
              <div className="flex items-center justify-center">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Abrir no App do Banco
              </div>
            </button>

            {/* Mobile: Show smaller QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-lg border-2 border-gray-300">
                <img
                  src={pixData.qrCodeBase64}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>
          </div>

          {/* Copy Paste Code (Both Desktop and Mobile) */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 text-center">
              Código Copia e Cola
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-3">
              <p className="text-xs text-gray-600 font-mono break-all">
                {pixData.copyPasteCode}
              </p>
            </div>

            {/* Copy Button */}
            <button
              onClick={copyToClipboard}
              className={`w-full py-3 md:py-4 px-4 rounded-lg font-semibold transition-all ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {copied ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Código Copiado!
                </div>
              ) : (
                <div className="flex items-center justify-center">
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar Código
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Como pagar:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm">
                <li className="md:hidden">Clique em "Abrir no App do Banco" ou</li>
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li className="hidden md:list-item">Escaneie o QR Code ou cole o código</li>
                <li className="md:hidden">Cole o código copiado</li>
                <li>Confirme o pagamento</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Pagamento via PIX</h3>
        <p className="text-gray-600">Pague à vista e ganhe desconto instantâneo</p>
      </div>

      {/* Exibição de valor com desconto */}
      {renderPriceDisplay()}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5"
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
              <h4 className="text-sm font-semibold text-red-800">Erro ao processar pagamento</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generate PIX Button, QR Code Display, Expired State, or Paid State */}
      {!pixData ? (
        <button
          onClick={generatePixPayment}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-3 text-white"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Gerando QR Code...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87-.96-7-5.54-7-10V8.3l7-3.5 7 3.5V10c0 4.46-3.13 9.04-7 10z" />
              </svg>
              Gerar QR Code PIX
            </div>
          )}
        </button>
      ) : paymentStatus === 'paid' ? (
        renderPaidState()
      ) : paymentStatus === 'expired' ? (
        renderExpiredState()
      ) : (
        <>
          {renderExpirationTimer()}
          {renderPollingIndicator()}
          {renderQRCode()}
        </>
      )}

      {/* Security Info */}
      <div className="flex items-center justify-center text-sm text-gray-600 mt-6">
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
        <span>Pagamento seguro processado pelo Stripe</span>
      </div>
    </div>
  )
}
