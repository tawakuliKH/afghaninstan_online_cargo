import { Link } from 'react-router-dom'
import { Package, ExternalLink } from 'lucide-react'

export function Footer() {
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
              A trusted coordination platform connecting verified senders and travelers for safe, cross-border package delivery between Afghanistan and the world.
            </p>
            <p className="mt-4 text-xs text-white/40">
              This platform does not transport, insure, or take custody of any package. All handovers happen in person between verified users.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
              Platform
            </h3>
            <ul className="space-y-2.5">
              {[
                { to: '/', label: 'Home' },
                { to: '/trips', label: 'Browse Trips' },
                { to: '/packages', label: 'Browse Packages' },
                { to: '/rules', label: 'Rules & Terms' },
                { to: '/register', label: 'Create Account' },
                { to: '/login', label: 'Sign In' },
              ].map((link) => (
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
              Built by
            </h3>
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">Khadim Tawakuli</p>
              <p className="text-xs text-white/50 leading-relaxed">
                Full-stack developer specializing in modern web applications.
              </p>
              <a
                href="https://tawakuli.dev"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:border-brand-accent hover:text-brand-accent"
              >
                <ExternalLink className="h-3 w-3" />
                Portfolio
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Afghanistan Online Cargo. All rights reserved.
          </p>
          <p className="text-xs text-white/40">
            Designed & developed by{' '}
            <a
              href="https://tawakuli.dev"
              target="_blank"
              rel="noreferrer"
              className="text-brand-accent hover:underline"
            >
              Khadim Tawakuli
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}