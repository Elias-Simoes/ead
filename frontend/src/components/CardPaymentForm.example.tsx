/**
 * Example usage of CardPaymentForm component
 * 
 * This file demonstrates how to integrate the CardPaymentForm
 * into a checkout page.
 */

import { CardPaymentForm } from './CardPaymentForm'
import { Plan } from '../types'
import api from '../services/api'

export const CardPaymentFormExample = () => {
  // Example plan data
  const plan: Plan = {
    id: 'plan_123',
    name: 'Plano Mensal Premium',
    price: 99.90,
    currency: 'BRL',
    interval: 'monthly',
    isActive: true,
  }

  // Payment configuration (would come from API in real usage)
  const maxInstallments = 12
  const installmentsWithoutInterest = 12

  // Handle payment submission
  const handleSubmit = async (installments: number) => {
    try {
      // Call API to create checkout session
      const response = await api.post('/payments/checkout', {
        planId: plan.id,
        paymentMethod: 'card',
        installments,
      })

      // Redirect to Stripe Checkout
      const { checkoutUrl } = response.data.data
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Error creating checkout:', error)
      throw error
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <CardPaymentForm
        plan={plan}
        maxInstallments={maxInstallments}
        installmentsWithoutInterest={installmentsWithoutInterest}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
