import { PixPaymentForm } from './PixPaymentForm'
import { Plan } from '../types'

/**
 * Example usage of PixPaymentForm component
 * 
 * This component handles:
 * - Display of discounted price
 * - QR Code generation and display
 * - Copy-paste code functionality
 * - Expiration timer with warnings
 * - Automatic payment status polling
 * - Mobile-responsive UI with bank app integration
 */

const ExamplePixPaymentForm: React.FC = () => {
  // Example plan data
  const examplePlan: Plan = {
    id: 'plan_123',
    name: 'Plano Mensal Premium',
    price: 99.90,
    currency: 'BRL',
    interval: 'monthly',
    isActive: true,
  }

  // PIX discount percentage (typically from payment config)
  const pixDiscountPercent = 10

  // Handle submission (called when QR Code is generated)
  const handleSubmit = async () => {
    console.log('PIX payment initiated')
    // Additional logic can be added here if needed
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Exemplo: Pagamento PIX</h1>
      
      <PixPaymentForm
        plan={examplePlan}
        pixDiscountPercent={pixDiscountPercent}
        onSubmit={handleSubmit}
      />

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Funcionalidades:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Exibição de valor original riscado e valor com desconto em destaque</li>
          <li>Geração de QR Code via API</li>
          <li>Código copia-e-cola com botão de copiar</li>
          <li>Timer de expiração com alerta aos 5 minutos</li>
          <li>Polling automático de status (3s inicialmente, exponential backoff)</li>
          <li>Redirecionamento automático quando pago</li>
          <li>Opção de gerar novo QR Code quando expirado</li>
          <li>UI responsiva: desktop mostra QR Code grande, mobile prioriza botão "Abrir no App"</li>
        </ul>
      </div>
    </div>
  )
}

export default ExamplePixPaymentForm
