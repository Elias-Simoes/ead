import React from 'react'

interface PaymentMethodSelectorProps {
  selectedMethod: 'card' | 'pix' | null
  onSelectMethod: (method: 'card' | 'pix') => void
  pixDiscountPercent: number
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  pixDiscountPercent,
}) => {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Escolha a forma de pagamento</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cartão de Crédito */}
        <button
          onClick={() => onSelectMethod('card')}
          className={`relative p-6 rounded-lg border-2 transition-all text-left ${
            selectedMethod === 'card'
              ? 'border-blue-600 bg-blue-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
          }`}
        >
          {/* Checkmark quando selecionado */}
          {selectedMethod === 'card' && (
            <div className="absolute top-4 right-4">
              <div className="bg-blue-600 rounded-full p-1">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Ícone do Cartão */}
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-lg ${
              selectedMethod === 'card' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <svg
                className={`w-8 h-8 ${
                  selectedMethod === 'card' ? 'text-blue-600' : 'text-gray-600'
                }`}
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
            </div>
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">Cartão de Crédito</h3>
          
          {/* Descrição */}
          <p className="text-gray-600 mb-4">Parcele em até 12x sem juros</p>

          {/* Vantagens */}
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
              <span>Parcele em até 12x</span>
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
              <span>Sem juros</span>
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
              <span>Ativação imediata</span>
            </li>
          </ul>
        </button>

        {/* PIX */}
        <button
          onClick={() => onSelectMethod('pix')}
          className={`relative p-6 rounded-lg border-2 transition-all text-left ${
            selectedMethod === 'pix'
              ? 'border-green-600 bg-green-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
          }`}
        >
          {/* Badge de Desconto */}
          <div className="absolute -top-3 -right-3">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {pixDiscountPercent}% OFF
            </div>
          </div>

          {/* Checkmark quando selecionado */}
          {selectedMethod === 'pix' && (
            <div className="absolute top-4 right-4">
              <div className="bg-green-600 rounded-full p-1">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Ícone do PIX */}
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-lg ${
              selectedMethod === 'pix' ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <svg
                className={`w-8 h-8 ${
                  selectedMethod === 'pix' ? 'text-green-600' : 'text-gray-600'
                }`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87-.96-7-5.54-7-10V8.3l7-3.5 7 3.5V10c0 4.46-3.13 9.04-7 10z" />
                <path d="M8.5 11.5l2 2 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">PIX</h3>
          
          {/* Descrição */}
          <p className="text-gray-600 mb-4">Pagamento à vista com desconto</p>

          {/* Vantagens */}
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
              <span className="font-semibold text-green-700">{pixDiscountPercent}% de desconto</span>
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
              <span>Confirmação instantânea</span>
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
              <span>Pagamento seguro</span>
            </li>
          </ul>
        </button>
      </div>
    </div>
  )
}
