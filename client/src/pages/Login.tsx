import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import { Package, Loader2, AlertCircle, X } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

function Login() {
  const { t } = useTranslation()
  const { setAuth, fetchAvatar } = useAuthStore()
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data)
      setLoginError(null)
      setAuth(res.data.user, res.data.accessToken)
      fetchAvatar()
      toast.success('Welcome back!')
      navigate('/')
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.'
      setLoginError(msg)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-3 flex justify-center">
              <div className="rounded-full bg-brand-primary/10 p-3">
                <Package className="h-8 w-8 text-brand-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-brand-primary">
              {t('auth.loginTitle')}
            </h1>
            <p className="mt-1 text-sm text-brand-muted">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t('auth.email')}
              </label>
              <input
                {...register('email', {
                  onChange: () => loginError && setLoginError(null),
                })}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-brand-danger">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t('auth.password')}
              </label>
              <input
                {...register('password', {
                  onChange: () => loginError && setLoginError(null),
                })}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-brand-danger">{errors.password.message}</p>
              )}
            </div>

            {loginError && (
              <div className="flex items-start gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="flex-1">{loginError}</p>
                <button
                  type="button"
                  onClick={() => setLoginError(null)}
                  aria-label="Dismiss"
                  className="shrink-0 text-brand-danger/70 hover:text-brand-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('auth.loginButton')}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-brand-muted">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium text-brand-accent hover:underline">
              {t('auth.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login