import { create } from 'zustand'
import api from '../lib/axios'

export interface AuthUser {
  id: string
  email: string
  nickname: string
  isAdmin: boolean
  accountStatus: string
  hasPosted?: boolean
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  avatarUrl: string | null
  isLoading: boolean
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setAvatarUrl: (url: string | null) => void
  fetchAvatar: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  avatarUrl: null,
  isLoading: true,
  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token)
    set({ user, accessToken: token })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, accessToken: null, avatarUrl: null })
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setAvatarUrl: (url) => set({ avatarUrl: url }),
  fetchAvatar: async () => {
    try {
      const res = await api.get('/auth/me/avatar')
      set({ avatarUrl: res.data.signedUrl ?? null })
    } catch {
      set({ avatarUrl: null })
    }
  },
}))