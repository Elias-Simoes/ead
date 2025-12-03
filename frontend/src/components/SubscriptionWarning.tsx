import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export const SubscriptionWarning = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Não mostrar aviso para admins e instrutores
  if (!user || user.role !== 'student') {
    return null
  }

  // Verificar se a assinatura está inativa ou expirada
  const isInactive = user.subscriptionStatus === 'inactive' || user.subscriptionStatus === 'cancelled'
  const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()
  
  if (!isInactive && !isExpired) {
    return null
  }

  // Calcular dias desde a expiração (se aplicável)
  let daysExpired = 0
  if (user.subscriptionExpiresAt) {
    const expiredDate = new Date(user.subscriptionExpiresAt)
    const today = new Date()
    daysExpired = Math.floor((today.getTime() - expiredDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {isExpired ? 'Assinatura Expirada' : 'Assinatura Inativa'}
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              {isExpired && daysExpired > 0 ? (
                <>
                  Sua assinatura expirou há {daysExpired} {daysExpired === 1 ? 'dia' : 'dias'}.
                </>
              ) : (
                <>Sua assinatura está inativa.</>
              )}
              {' '}
              Para continuar acessando os cursos e avaliações, você precisa renovar sua assinatura. 
              Acesse a página de cursos para renovar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
