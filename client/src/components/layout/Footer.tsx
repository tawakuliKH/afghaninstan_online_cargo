import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, ExternalLink } from 'lucide-react'

export function Footer() {
  const { t } = useTranslation()

  const navLinks = [
    { to: '/', label: t('footer.home') },
    { to: '/trips', label: t('footer.browseTrips') },
    { to: '/packages', label: t('footer.browsePackages') },
    { to: '/rules', label: t('footer.rulesTerms') },
    { to: '/register', label: t('footer.createAccount') },
    { to: '/login', label: t('footer.signIn') },
  ]

  return (
    <footer className="bg-brand-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-6 w-6 text-brand-accent" />
              <span className="text-lg font-bold">
                Afghanistan <span className="text-brand-accent">Online Cargo</span>
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              {t('footer.tagline')}
            </p>
            <p className="mt-4 text-xs text-white/40">
              {t('footer.disclaimer')}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              {t('footer.platformHeading')}
            </h3>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/60 transition hover:text-brand-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Built by */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              {t('footer.builtByHeading')}
            </h3>
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Shayan Ali Mughol</p>
              <p className="text-xs text-white/50 leading-relaxed">
                {t('footer.devTagline')}
              </p>
              <a
                href="https://tawakuli.dev"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-brand-accent hover:text-brand-accent"
              >
                <ExternalLink className="h-3 w-3" />
                {t('footer.portfolio')}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            {t('footer.allRightsReserved', { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-white/40">
            {t('footer.designedBy')}{' '}
            <a
              href="https://shayan.dev"
              target="_blank"
              rel="noreferrer"
              className="text-brand-accent hover:underline"
            >
              Shayan Ali Mughol
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
