import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/axios'
import { Package, Globe, LogOut, User, Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function Navbar() {
  const { t, i18n } = useTranslation()
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // even if the server call fails, clear local state
    }
    clearAuth()
    toast.success(t('nav.loggedOut'))
    navigate('/login')
  }

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/trips', label: t('nav.trips') },
    { to: '/packages', label: t('nav.packages') },
    { to: '/rules', label: t('nav.rules') },
  ]

  return (
    <header className="sticky top-0 z-50 bg-brand-primary shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white">
          <Package className="h-7 w-7 text-brand-accent" />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-brand-accent">Afghanistan Online Cargo</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-white/80 transition hover:text-brand-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Language switcher */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fa-AF' : 'en')}
            className="flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-brand-accent hover:text-brand-accent"
          >
            <Globe className="h-3 w-3" />
            {i18n.language === 'en' ? 'دری' : 'EN'}
          </button>

          {user ? (
            <>
              {/* Notifications */}
              <Link
                to="/profile?tab=notifications"
                className="relative text-white/80 transition hover:text-brand-accent"
              >
                <Bell className="h-5 w-5" />
              </Link>

              {/* Profile */}
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20"
              >
                <User className="h-4 w-4" />
                {user.nickname}
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-white/60 transition hover:text-brand-danger"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-white/80 transition hover:text-brand-accent"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-brand-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="text-white md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-brand-primary px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-3 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-white/80 transition hover:text-brand-accent"
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-white/10" />
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm text-white/80">
                  {t('nav.profile')} — {user.nickname}
                </Link>
                <button onClick={handleLogout} className="text-start text-sm text-brand-danger">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm text-white/80">
                  {t('nav.login')}
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-brand-accent">
                  {t('nav.register')}
                </Link>
              </>
            )}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fa-AF' : 'en')}
              className="text-start text-sm text-white/60"
            >
              {i18n.language === 'en' ? 'دری' : 'EN'}
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}