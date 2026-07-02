import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'

export function useBootstrapAuth() {
  const { setAuth, clearAuth, setLoading } = useAuthStore()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then((res) => {
        setAuth(res.data.user, token)
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])
}