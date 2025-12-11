import { create } from 'zustand'
import api from '../services/api'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'student'
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'cancelled'
  subscriptionExpiresAt?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  register: (name: string, email: string, password: string, gdprConsent: boolean) => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { tokens } = response.data.data

      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)

      // Buscar dados completos do usuário incluindo informações de assinatura
      const meResponse = await api.get('/auth/me')
      const user = meResponse.data

      set({ user, isAuthenticated: true })
      return user
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, isAuthenticated: false })
  },

  register: async (name: string, email: string, password: string, gdprConsent: boolean) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        gdprConsent,
      })
      const { accessToken, refreshToken } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)

      // Buscar dados completos do usuário incluindo informações de assinatura
      const meResponse = await api.get('/auth/me')
      const user = meResponse.data

      set({ user, isAuthenticated: true })
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const response = await api.get('/auth/me')
      set({ user: response.data, isAuthenticated: true, isLoading: false })
    } catch (error) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
