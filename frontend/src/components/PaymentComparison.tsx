import React from 'react'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  interval: string
}

interface PaymentComparisonProps {
  plan: Plan
  pixDiscountPercent: number
  maxInstallments: number
}

export const PaymentComparison: React.FC<PaymentComparisonProps> = ({
  plan,
  pixDiscountPercent,
  maxInstallments,
}) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
  }

  const pixPrice = plan.price * (1 - pixDiscountPercent / 100)
  const savings = plan.price - pixPrice
  const installmentValue = plan.price / maxInstallments

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h3 className="text-xl font-bold text-white">Compare as opções de pagamento</h3>
        <p className="text-blue-100 text-sm mt-1">Escolha a melhor forma para você</p>
      </div>

      <div className="p-6">
        {/* Tabela Comparativa - Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700"></th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 bg-blue-50 rounded-t-lg">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
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
                    Cartão de Crédito
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900 bg-green-50 rounded-t-lg">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-600"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87-.96-7-5.54-7-10V8.3l7-3.5 7 3.5V10c0 4.46-3.13 9.04-7 10z" />
                    </svg>
                    PIX
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Valor Total */}
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 font-medium text-gray-700">Valor Total</td>
                <td className="py-4 px-4 text-center bg-blue-50">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center bg-green-50">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {formatPrice(pixPrice, plan.currency)}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Parcelas */}
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 font-medium text-gray-700">Parcelas</td>
                <td className="py-4 px-4 text-center bg-blue-50">
                  <span className="text-gray-900">
                    Até {maxInstallments}x de {formatPrice(installmentValue, plan.currency)}
                  </span>
                  <div className="text-xs text-gray-600 mt-1">sem juros</div>
                </td>
                <td className="py-4 px-4 text-center bg-green-50">
                  <span className="text-gray-900">À vista</span>
                </td>
              </tr>

              {/* Desconto */}
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4 font-medium text-gray-700">Desconto</td>
                <td className="py-4 px-4 text-center bg-blue-50">
                  <span className="text-gray-500">-</span>
                </td>
                <td className="py-4 px-4 text-center bg-green-50">
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-green-700">{pixDiscountPercent}%</span>
                    <span className="text-sm text-green-600">
                      Economize {formatPrice(savings, plan.currency)}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Confirmação */}
              <tr>
                <td className="py-4 px-4 font-medium text-gray-700">Confirmação</td>
                <td className="py-4 px-4 text-center bg-blue-50">
                  <span className="text-gray-900">Imediata</span>
                </td>
                <td className="py-4 px-4 text-center bg-green-50">
                  <span className="text-gray-900 font-semibold">Instantânea</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cards Comparativos - Mobile */}
        <div className="md:hidden space-y-4">
          {/* Cartão de Crédito */}
          <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
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
                <h4 className="font-bold text-gray-900">Cartão de Crédito</h4>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Valor Total:</span>
                <span className="font-bold text-gray-900">{formatPrice(plan.price, plan.currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Parcelas:</span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {maxInstallments}x de {formatPrice(installmentValue, plan.currency)}
                  </div>
                  <div className="text-xs text-gray-600">sem juros</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Desconto:</span>
                <span className="text-gray-500">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confirmação:</span>
                <span className="text-gray-900">Imediata</span>
              </div>
            </div>
          </div>

          {/* PIX */}
          <div className="border-2 border-green-200 rounded-lg overflow-hidden">
            <div className="bg-green-50 px-4 py-3 border-b border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87-.96-7-5.54-7-10V8.3l7-3.5 7 3.5V10c0 4.46-3.13 9.04-7 10z" />
                  </svg>
                  <h4 className="font-bold text-gray-900">PIX</h4>
                </div>
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {pixDiscountPercent}% OFF
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Valor Total:</span>
                <div className="text-right">
                  <div className="text-sm text-gray-500 line-through">
                    {formatPrice(plan.price, plan.currency)}
                  </div>
                  <div className="font-bold text-green-700">
                    {formatPrice(pixPrice, plan.currency)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Parcelas:</span>
                <span className="text-gray-900">À vista</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Desconto:</span>
                <div className="text-right">
                  <div className="font-bold text-green-700">{pixDiscountPercent}%</div>
                  <div className="text-sm text-green-600">
                    Economize {formatPrice(savings, plan.currency)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confirmação:</span>
                <span className="font-semibold text-gray-900">Instantânea</span>
              </div>
            </div>
          </div>
        </div>

        {/* Destaque da Economia */}
        {savings > 0 && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-green-800 font-semibold">
                Pagando com PIX você economiza {formatPrice(savings, plan.currency)}!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
