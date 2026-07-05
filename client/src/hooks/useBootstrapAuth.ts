import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useHealthStore } from '../store/healthStore'
import api from '../lib/axios'

export function useBootstrapAuth() {
  const { setAuth, clearAuth, setLoading, fetchAvatar } = useAuthStore()
  const { setHealthy } = useHealthStore()

  useEffect(() => {
    api
      .get('/health')
      .then((res) => {
        setHealthy(res.status === 200 && res.data.status === 'ok')
      })
      .catch(() => {
        setHealthy(false)
      })
      .finally(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setLoading(false)
          return
        }

        api
          .get('/auth/me')
          .then((res) => {
            setAuth(res.data.user, token)
            fetchAvatar()
          })
          .catch(() => {
            clearAuth()
          })
          .finally(() => {
            setLoading(false)
          })
      })
  }, [])
}