import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  nickname: string
  isAdmin: boolean
  accountStatus: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token)
    set({ user, accessToken: token })
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, accessToken: null })
  },
  setLoading: (loading) => set({ isLoading: loading }),
}))