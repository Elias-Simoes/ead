/**
 * Example usage of PaymentMethodSelector and PaymentComparison components
 * 
 * This file demonstrates how to integrate the payment method selection
 * components into a checkout page.
 */

import { useState } from 'react'
import { PaymentMethodSelector } from './PaymentMethodSelector'
import { PaymentComparison } from './PaymentComparison'

export const PaymentMethodSelectorExample = () => {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'pix' | null>(null)

  // Example plan data
  const plan = {
    id: 'plan_123',
    name: 'Plano Mensal',
    price: 99.90,
    currency: 'BRL',
    interval: 'month',
  }

  // Example configuration (would come from API)
  const pixDiscountPercent = 10
  const maxInstallments = 12

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Payment Comparison Table */}
      <PaymentComparison
        plan={plan}
        pixDiscountPercent={pixDiscountPercent}
        maxInstallments={maxInstallments}
      />

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        pixDiscountPercent={pixDiscountPercent}
      />

      {/* Show selected method */}
      {selectedMethod && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900">
            Método selecionado: <strong>{selectedMethod === 'card' ? 'Cartão de Crédito' : 'PIX'}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
