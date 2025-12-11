import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import api from '../services/api'
import { Student } from '../types'
import { useAuthStore } from '../stores/authStore'

export const ProfilePage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const getProfileEndpoint = () => {
    if (user?.role === 'student') {
      return '/students/profile'
    } else if (user?.role === 'instructor') {
      return '/instructors/profile'
    } else if (user?.role === 'admin') {
      return '/admin/profile'
    }
    return '/students/profile' // fallback
  }

  const fetchProfile = async () => {
    try {
      // Apenas estudantes têm página de perfil completa
      if (user?.role !== 'student') {
        setError('Página de perfil disponível apenas para estudantes')
        setLoading(false)
        return
      }

      const endpoint = getProfileEndpoint()
      const response = await api.get<{ data: { profile: any } }>(endpoint)
      const rawProfile = response.data.data.profile
      
      // Transform snake_case to camelCase
      const profileData: Student = {
        id: rawProfile.id,
        email: rawProfile.email,
        name: rawProfile.name,
        role: 'student',
        isActive: rawProfile.is_active,
        createdAt: rawProfile.created_at,
        updatedAt: rawProfile.updated_at || rawProfile.created_at,
        subscriptionStatus: rawProfile.subscription_status,
        subscriptionExpiresAt: rawProfile.subscription_expires_at,
        totalStudyTime: rawProfile.total_study_time || 0,
      }
      
      setProfile(profileData)
      setFormData({
        name: profileData.name,
        bio: '',
      })
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const endpoint = getProfileEndpoint()
      const response = await api.patch<{ data: { profile: any } }>(endpoint, formData)
      const rawProfile = response.data.data.profile
      
      // Transform snake_case to camelCase
      const profileData: Student = {
        id: rawProfile.id,
        email: rawProfile.email,
        name: rawProfile.name,
        role: 'student',
        isActive: rawProfile.is_active,
        createdAt: rawProfile.created_at,
        updatedAt: rawProfile.updated_at || rawProfile.created_at,
        subscriptionStatus: rawProfile.subscription_status,
        subscriptionExpiresAt: rawProfile.subscription_expires_at,
        totalStudyTime: rawProfile.total_study_time || 0,
      }
      
      setProfile(profileData)
      setEditing(false)
      setSuccess('Perfil atualizado com sucesso!')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao atualizar perfil')
    }
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-yellow-600 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-yellow-800 mb-2">
                  Página de Perfil Indisponível
                </h3>
                <p className="text-yellow-700 mb-4">
                  {user?.role === 'instructor'
                    ? 'Como instrutor, você pode gerenciar suas informações através do Dashboard do Instrutor.'
                    : user?.role === 'admin'
                    ? 'Como administrador, você pode gerenciar suas informações através do Dashboard Admin.'
                    : error || 'Perfil não encontrado'}
                </p>
                {user?.role === 'instructor' && (
                  <a
                    href="/instructor/dashboard"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Ir para Dashboard do Instrutor
                  </a>
                )}
                {user?.role === 'admin' && (
                  <a
                    href="/admin/dashboard"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    Ir para Dashboard Admin
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Meu Perfil</h1>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Informações Pessoais</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      name: profile.name,
                      bio: '',
                    })
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
                <p className="text-gray-900">{profile.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">E-mail</label>
                <p className="text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Membro desde
                </label>
                <p className="text-gray-900">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status da Assinatura</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : profile.subscriptionStatus === 'suspended'
                    ? 'bg-yellow-100 text-yellow-800'
                    : profile.subscriptionStatus === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {profile.subscriptionStatus === 'active'
                  ? 'Ativa'
                  : profile.subscriptionStatus === 'suspended'
                  ? 'Suspensa'
                  : profile.subscriptionStatus === 'cancelled'
                  ? 'Cancelada'
                  : profile.subscriptionExpiresAt
                  ? 'Expirada'
                  : 'Sem Assinatura'}
              </span>
            </div>
            {profile.subscriptionExpiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Válida até</span>
                <span className="text-gray-900">{formatDate(profile.subscriptionExpiresAt)}</span>
              </div>
            )}
            {profile.subscriptionStatus !== 'active' && (
              <button
                onClick={() => {
                  // Verificar se é usuário novo (nunca teve assinatura) ou usuário com assinatura expirada/cancelada
                  const isNewUser = profile.subscriptionStatus === 'inactive' && !profile.subscriptionExpiresAt
                  navigate(isNewUser ? '/plans' : '/subscription/renew')
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium flex items-center justify-center"
              >
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
                    d={
                      profile.subscriptionStatus === 'inactive' && !profile.subscriptionExpiresAt
                        ? "M12 6v6m0 0v6m0-6h6m-6 0H6"
                        : "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    }
                  />
                </svg>
                {profile.subscriptionStatus === 'inactive' && !profile.subscriptionExpiresAt
                  ? 'Assinar Plano'
                  : 'Renovar Assinatura'}
              </button>
            )}
          </div>
        </div>

        {/* Study Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estatísticas de Estudo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tempo Total de Estudo</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatTime(profile.totalStudyTime || 0)}
                  </p>
                </div>
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Último Acesso</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatDate(profile.lastAccessAt)}
                  </p>
                </div>
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
