import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/axios'
import { MapPin, Package, ArrowRight, Shield, Clock, Users } from 'lucide-react'

// ── Hero animation ──────────────────────────────────────────

function HeroAnimation() {
  return (
    <div className="relative flex h-48 items-center justify-center overflow-hidden">
      {/* Flight path line */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 120">
        <motion.path
          d="M 30 90 Q 200 10 370 90"
          fill="none"
          stroke="#2DB7C4"
          strokeWidth="2"
          strokeDasharray="8 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        {/* Origin dot */}
        <motion.circle
          cx="30" cy="90" r="5"
          fill="#F2A60D"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        />
        {/* Destination dot */}
        <motion.circle
          cx="370" cy="90" r="5"
          fill="#F2A60D"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.8 }}
        />
      </svg>

      {/* Plane icon moving along the path */}
      <motion.div
        className="absolute text-3xl"
        initial={{ x: -160, y: 30 }}
        animate={{ x: 160, y: -20 }}
        transition={{
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: 1.5,
        }}
      >
        ✈️
      </motion.div>

      {/* Origin label */}
      <motion.div
        className="absolute bottom-2 left-4 text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs font-semibold text-brand-accent">کابل</p>
        <p className="text-xs text-white/60">Kabul</p>
      </motion.div>

      {/* Destination label */}
      <motion.div
        className="absolute bottom-2 right-4 text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <p className="text-xs font-semibold text-brand-accent">Frankfurt</p>
        <p className="text-xs text-white/60">Germany</p>
      </motion.div>
    </div>
  )
}

// ── How it works ────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      icon: Users,
      title: 'Verify your identity',
      desc: 'Register with your passport or Tazkira. Every user is manually reviewed and approved.',
    },
    {
      icon: Package,
      title: 'Post or find',
      desc: 'Senders post packages. Travelers post trips. Find each other and connect directly.',
    },
    {
      icon: Shield,
      title: 'Hand over safely',
      desc: 'Meet in person, verify ID, and hand over the package. The platform records every step as legal proof.',
    },
    {
      icon: Clock,
      title: 'Track & confirm',
      desc: 'Both parties confirm handover and final delivery. Reviews build trust over time.',
    },
  ]

  return (
    <div className="py-16">
      <h2 className="mb-2 text-center text-2xl font-bold text-brand-primary">
        How Afghanistan Online Cargo Works
      </h2>
      <p className="mb-10 text-center text-sm text-brand-muted">
        A trusted coordination platform — not a courier. All handovers happen in person between verified users.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl bg-white p-6 shadow-sm text-center"
            >
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-brand-primary/10 p-3">
                  <Icon className="h-6 w-6 text-brand-primary" />
                </div>
              </div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-accent">
                Step {i + 1}
              </p>
              <h3 className="mb-2 font-semibold text-brand-primary">{step.title}</h3>
              <p className="text-xs text-brand-muted">{step.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Mini card components ────────────────────────────────────

function TripMiniCard({ trip }: { trip: any }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-brand-accent" />
        <span className="text-sm font-medium text-brand-primary">
          {trip.originCity} → {trip.destCity}
        </span>
      </div>
      <p className="text-xs text-brand-muted">{trip.originCountry} → {trip.destCountry}</p>
      <p className="mt-2 text-xs text-brand-muted">
        Departure: {new Date(trip.departureDate).toLocaleDateString()}
      </p>
      <p className="mt-1 text-xs text-brand-muted">
        By: {trip.traveler?.nickname}
      </p>
    </div>
  )
}

function PackageMiniCard({ pkg }: { pkg: any }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-4 w-4 text-brand-accent" />
        <span className="text-sm font-medium text-brand-primary">{pkg.title}</span>
      </div>
      <p className="text-xs text-brand-muted">{pkg.originCity} → {pkg.destCity}</p>
      <p className="mt-2 text-xs text-brand-muted">{pkg.weight} kg</p>
      <p className="mt-1 text-xs text-brand-muted">
        By: {pkg.sender?.nickname}
      </p>
    </div>
  )
}

// ── Main Home page ──────────────────────────────────────────

function Home() {
  const [recentTrips, setRecentTrips] = useState<any[]>([])
  const [recentPackages, setRecentPackages] = useState<any[]>([])

  useEffect(() => {
    api.get('/trips?page=1').then((res) => {
      setRecentTrips(res.data.trips.slice(0, 3))
    })
    api.get('/packages?page=1').then((res) => {
      setRecentPackages(res.data.packages.slice(0, 3))
    })
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-primary px-4 py-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
        >
          Afghanistan Online Cargo
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mb-8 max-w-xl text-sm text-white/70 sm:text-base"
        >
          Connect verified senders and travelers for safe, coordinated cross-border package delivery.
        </motion.p>

        <HeroAnimation />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Link
            to="/trips"
            className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Browse Trips
          </Link>
          <Link
            to="/packages"
            className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Browse Packages
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-primary transition hover:opacity-90"
          >
            Get Started
          </Link>
        </motion.div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4">
        <HowItWorks />

        {/* Recent Trips + Packages side by side */}
        <div className="pb-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

            {/* Recent Trips */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-primary">Recent Trips</h2>
                <Link
                  to="/trips"
                  className="flex items-center gap-1 text-sm text-brand-accent hover:underline"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {recentTrips.length === 0 ? (
                <p className="text-sm text-brand-muted">No trips posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentTrips.map((trip) => (
                    <TripMiniCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Packages */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-primary">Recent Packages</h2>
                <Link
                  to="/packages"
                  className="flex items-center gap-1 text-sm text-brand-accent hover:underline"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {recentPackages.length === 0 ? (
                <p className="text-sm text-brand-muted">No packages posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentPackages.map((pkg) => (
                    <PackageMiniCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home