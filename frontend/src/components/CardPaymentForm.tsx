import React, { useState } from 'react'
import { Plan } from '../types'

interface CardPaymentFormProps {
  plan: Plan
  maxInstallments: number
  installmentsWithoutInterest: number
  onSubmit: (installments: number) => Promise<void>
}

export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  plan,
  maxInstallments,
  installmentsWithoutInterest,
  onSubmit,
}) => {
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
  }

  const calculateInstallmentValue = (installments: number) => {
    return plan.price / installments
  }

  const hasInterest = (installments: number) => {
    return installments > installmentsWithoutInterest
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await onSubmit(selectedInstallments)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  // Generate installment options
  const installmentOptions = Array.from({ length: maxInstallments }, (_, i) => i + 1)

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Pagamento com Cartão de Crédito</h3>
        <p className="text-gray-600">Escolha o número de parcelas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seletor de Parcelas */}
        <div>
          <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-2">
            Número de parcelas
          </label>
          <select
            id="installments"
            value={selectedInstallments}
            onChange={(e) => setSelectedInstallments(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            disabled={loading}
          >
            {installmentOptions.map((installments) => {
              const installmentValue = calculateInstallmentValue(installments)
              const withInterest = hasInterest(installments)
              
              return (
                <option key={installments} value={installments}>
                  {installments}x de {formatPrice(installmentValue, plan.currency)}
                  {withInterest ? ' (com juros)' : ' (sem juros)'}
                </option>
              )
            })}
          </select>
        </div>

        {/* Resumo do Pagamento */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-gray-900 mb-3">Resumo do Pagamento</h4>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Plano:</span>
            <span className="font-medium text-gray-900">{plan.name}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Parcelas:</span>
            <span className="font-medium text-gray-900">
              {selectedInstallments}x de {formatPrice(calculateInstallmentValue(selectedInstallments), plan.currency)}
            </span>
          </div>

          {!hasInterest(selectedInstallments) && (
            <div className="flex items-center text-green-600 text-sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Sem juros</span>
            </div>
          )}

          {hasInterest(selectedInstallments) && (
            <div className="flex items-center text-amber-600 text-sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Com juros</span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Valor Total:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(plan.price, plan.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl'
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
              Processando...
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Pagar com Cartão
            </div>
          )}
        </button>

        {/* Security Info */}
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
          <span>Pagamento seguro processado pelo Stripe</span>
        </div>
      </form>
    </div>
  )
}
