import { useState, FormEvent, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [gdprConsent, setGdprConsent] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  // Requisitos de senha
  const passwordRequirements: PasswordRequirement[] = [
    { label: 'Mínimo de 8 caracteres', test: (pwd) => pwd.length >= 8 },
    { label: 'Uma letra maiúscula (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'Uma letra minúscula (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'Um número (0-9)', test: (pwd) => /\d/.test(pwd) },
    { label: 'Um caractere especial (@$!%*?&)', test: (pwd) => /[@$!%*?&]/.test(pwd) },
  ]

  // Validação em tempo real
  const passwordValidation = useMemo(() => {
    return passwordRequirements.map((req) => ({
      ...req,
      met: req.test(password),
    }))
  }, [password])

  const isPasswordValid = useMemo(() => {
    return passwordValidation.every((req) => req.met)
  }, [passwordValidation])

  const isPasswordsMatch = useMemo(() => {
    return password === confirmPassword && confirmPassword.length > 0
  }, [password, confirmPassword])

  const isFormValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      isPasswordValid &&
      isPasswordsMatch &&
      gdprConsent
    )
  }, [name, email, isPasswordValid, isPasswordsMatch, gdprConsent])

  // Classe de borda do campo de senha
  const getPasswordBorderClass = () => {
    if (password.length === 0) return 'border-gray-300'
    return isPasswordValid ? 'border-green-500' : 'border-red-500'
  }

  // Classe de borda do campo de confirmar senha
  const getConfirmPasswordBorderClass = () => {
    if (confirmPassword.length === 0) return 'border-gray-300'
    return isPasswordsMatch ? 'border-green-500' : 'border-red-500'
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isFormValid) {
      setError('Por favor, preencha todos os campos corretamente')
      return
    }

    setIsLoading(true)

    try {
      await register(name, email, password, gdprConsent)
      navigate('/')
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 'Falha no cadastro. Tente novamente.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Criar nova conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              entrar na sua conta existente
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                E-mail
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${getPasswordBorderClass()} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors`}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                disabled={isLoading}
              />
              {password.length > 0 && isPasswordValid && (
                <div className="mt-1 flex items-center text-sm text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Senha válida
                </div>
              )}
              {showPasswordRequirements && password.length > 0 && !isPasswordValid && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Requisitos da senha:</p>
                  <ul className="space-y-1">
                    {passwordValidation.map((req, index) => (
                      <li key={index} className="flex items-center text-xs">
                        {req.met ? (
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                          {req.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar senha
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none relative block w-full px-3 py-2 border ${getConfirmPasswordBorderClass()} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors`}
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              {confirmPassword.length > 0 && !isPasswordsMatch && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  As senhas não coincidem
                </div>
              )}
              {confirmPassword.length > 0 && isPasswordsMatch && (
                <div className="mt-1 flex items-center text-sm text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  As senhas coincidem
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="gdpr-consent"
                name="gdpr-consent"
                type="checkbox"
                required
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                checked={gdprConsent}
                onChange={(e) => setGdprConsent(e.target.checked)}
                disabled={isLoading}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="gdpr-consent" className="font-medium text-gray-700">
                Aceito os{' '}
                <a href="/terms" className="text-indigo-600 hover:text-indigo-500">
                  termos de uso
                </a>{' '}
                e{' '}
                <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                  política de privacidade
                </a>
              </label>
              <p className="text-gray-500 text-xs mt-1">
                Seus dados serão tratados conforme a LGPD
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
                isFormValid && !isLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
            {!isFormValid && !isLoading && (
              <p className="mt-2 text-xs text-center text-gray-500">
                Preencha todos os campos corretamente para continuar
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
