import { Routes, Route, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './pages/Home'
import Trips from './pages/Trips'
import Packages from './pages/Packages'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Rules from './pages/Rules'
import NotFound from './pages/NotFound'
import { useDocumentDirection } from './hooks/useDocumentDirection'

function App() {
  const { t, i18n } = useTranslation()
  useDocumentDirection()

  return (
    <div>
      <nav className="flex items-center justify-between bg-brand-primary p-4 text-white">
        <div className="flex gap-4">
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/trips">{t('nav.trips')}</Link>
          <Link to="/packages">{t('nav.packages')}</Link>
          <Link to="/login">{t('nav.login')}</Link>
          <Link to="/register">{t('nav.register')}</Link>
          <Link to="/profile">{t('nav.profile')}</Link>
          <Link to="/rules">{t('nav.rules')}</Link>
        </div>

        {/* Temporary language switcher — real one goes in Navbar component later */}
        <div className="flex gap-2">
          <button onClick={() => i18n.changeLanguage('en')} className="rounded bg-white/10 px-2 py-1">
            EN
          </button>
          <button onClick={() => i18n.changeLanguage('fa-AF')} className="rounded bg-white/10 px-2 py-1">
            دری
          </button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App