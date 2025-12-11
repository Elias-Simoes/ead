import { useAuth } from '../contexts/AuthContext'
export const SubscriptionWarning = () => {
  const { user } = useAuth()

  // Não mostrar aviso para admins e instrutores
  if (!user || user.role !== 'student') {
    return null
  }

  // Verificar se a assinatura está inativa ou expirada
  const isInactive = user.subscriptionStatus === 'inactive' || user.subscriptionStatus === 'cancelled'
  const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()
  
  // Verificar se é um usuário novo (nunca teve assinatura)
  const isNewUser = user.subscriptionStatus === 'inactive' && !user.subscriptionExpiresAt
  
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

  // Determinar título e mensagem baseado no tipo de usuário
  let title = ''
  let message = ''
  
  if (isNewUser) {
    title = 'Bem-vindo à Plataforma!'
    message = 'Para acessar nossos cursos exclusivos, você precisa escolher um plano. Acesse a página de planos e finalize sua assinatura para começar.'
  } else if (user.subscriptionStatus === 'cancelled') {
    title = 'Assinatura Cancelada'
    message = 'Sua assinatura foi cancelada. Para voltar a acessar os cursos, você precisa renovar sua assinatura.'
  } else if (isExpired && daysExpired > 0) {
    title = 'Assinatura Expirada'
    message = `Sua assinatura expirou há ${daysExpired} ${daysExpired === 1 ? 'dia' : 'dias'}. Para continuar acessando os cursos e avaliações, você precisa renovar sua assinatura.`
  } else {
    title = 'Assinatura Expirada'
    message = 'Sua assinatura expirou. Para continuar acessando os cursos e avaliações, você precisa renovar sua assinatura.'
  }

  return (
    <div className={`border-l-4 p-4 mb-6 ${isNewUser ? 'bg-blue-50 border-blue-400' : 'bg-yellow-50 border-yellow-400'}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {isNewUser ? (
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
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
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${isNewUser ? 'text-blue-800' : 'text-yellow-800'}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${isNewUser ? 'text-blue-700' : 'text-yellow-700'}`}>
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
