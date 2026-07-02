import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Clock, CheckCircle, XCircle, AlertTriangle,
  MapPin, Package, Truck, MessageSquare, Bell,
  Calendar, Weight, Loader2, Trash2, Star
} from 'lucide-react'

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Pending Review',
    message: 'Your account is currently under review. An administrator will approve or reject your registration shortly.',
  },
  APPROVED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Approved',
    message: '',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-brand-danger',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Rejected',
    message: 'Your registration was rejected. Please contact support.',
  },
  SUSPENDED: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Suspended',
    message: 'Your account has been suspended. Please contact support.',
  },
}

// ── Sub-components ──────────────────────────────────────────

function MyTrips() {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/trips?page=1').then((res) => {
      const { user } = useAuthStore.getState()
      setTrips(res.data.trips.filter((t: any) => t.travelerId === user?.id))
    }).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trip?')) return
    try {
      await api.delete(`/trips/${id}`)
      setTrips((prev) => prev.filter((t) => t.id !== id))
      toast.success('Trip deleted')
    } catch {
      toast.error('Failed to delete trip')
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
  if (trips.length === 0) return (
    <div className="py-10 text-center">
      <p className="text-brand-muted">You haven't posted any trips yet.</p>
      <Link to="/trips/new" className="mt-3 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white">Post a trip</Link>
    </div>
  )

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div key={trip.id} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-accent" />
              <span className="font-medium text-brand-primary">
                {trip.originCity}, {trip.originCountry} → {trip.destCity}, {trip.destCountry}
              </span>
            </div>
            <button onClick={() => handleDelete(trip.id)} className="text-brand-muted hover:text-brand-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex gap-3">
            <span className="flex items-center gap-1 text-xs text-brand-muted">
              <Calendar className="h-3 w-3" />
              {new Date(trip.departureDate).toLocaleDateString()}
            </span>
            {trip.capacityNote && (
              <span className="text-xs text-brand-muted">{trip.capacityNote}</span>
            )}
          </div>
        </div>
      ))}
      <Link to="/trips/new" className="inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white">
        + Post another trip
      </Link>
    </div>
  )
}

function MyPackages() {
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/packages?page=1').then((res) => {
      const { user } = useAuthStore.getState()
      setPackages(res.data.packages.filter((p: any) => p.senderId === user?.id))
    }).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return
    try {
      await api.delete(`/packages/${id}`)
      setPackages((prev) => prev.filter((p) => p.id !== id))
      toast.success('Package deleted')
    } catch {
      toast.error('Failed to delete package')
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
  if (packages.length === 0) return (
    <div className="py-10 text-center">
      <p className="text-brand-muted">You haven't posted any packages yet.</p>
      <Link to="/packages/new" className="mt-3 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white">Post a package</Link>
    </div>
  )

  return (
    <div className="space-y-4">
      {packages.map((pkg) => (
        <div key={pkg.id} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-brand-accent" />
              <span className="font-medium text-brand-primary">{pkg.title}</span>
            </div>
            <button onClick={() => handleDelete(pkg.id)} className="text-brand-muted hover:text-brand-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex gap-3">
            <span className="flex items-center gap-1 text-xs text-brand-muted">
              <Weight className="h-3 w-3" /> {pkg.weight} kg
            </span>
            <span className="flex items-center gap-1 text-xs text-brand-muted">
              <MapPin className="h-3 w-3" />
              {pkg.originCity} → {pkg.destCity}
            </span>
          </div>
        </div>
      ))}
      <Link to="/packages/new" className="inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white">
        + Post another package
      </Link>
    </div>
  )
}

function MyDeliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    api.get('/deliveries/mine').then((res) => {
      setDeliveries(res.data.deliveries)
    }).finally(() => setLoading(false))
  }, [])

  const statusColors: Record<string, string> = {
    PROPOSED: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-blue-100 text-blue-700',
    FINALIZED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
  if (deliveries.length === 0) return (
    <div className="py-10 text-center">
      <p className="text-brand-muted">No deliveries yet.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {deliveries.map((d) => (
        <div key={d.id} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-brand-primary">{d.package?.title}</p>
              <p className="text-xs text-brand-muted">
                {d.package?.destCity}, {d.package?.destCountry}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[d.status]}`}>
              {d.status}
            </span>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-brand-muted">
            <span>
              {user?.id === d.senderId ? (
                <>Traveler: <span className="font-medium text-brand-primary">{d.traveler?.nickname}</span></>
              ) : (
                <>Sender: <span className="font-medium text-brand-primary">{d.sender?.nickname}</span></>
              )}
            </span>
            <span>{d.agreedAmount} {d.currency}</span>
          </div>
          {d.estimatedDeliveryDate && (
            <p className="mt-1 text-xs text-brand-muted">
              Est. delivery: {new Date(d.estimatedDeliveryDate).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function MyMessages() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/messages/conversations').then((res) => {
      setConversations(res.data.conversations)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
  if (conversations.length === 0) return (
    <div className="py-10 text-center">
      <p className="text-brand-muted">No messages yet.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {conversations.map((c, i) => (
        <Link
          key={i}
          to={`/messages/${c.partner.id}`}
          className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10 font-bold text-brand-primary">
            {c.partner.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-brand-primary">{c.partner.nickname}</p>
            <p className="truncate text-xs text-brand-muted">{c.lastMessage.content}</p>
          </div>
          <p className="text-xs text-brand-muted">
            {new Date(c.lastMessage.createdAt).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  )
}

function MyNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data.notifications)
    }).finally(() => setLoading(false))
  }, [])

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    )
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-primary" /></div>
  if (notifications.length === 0) return (
    <div className="py-10 text-center">
      <p className="text-brand-muted">No notifications yet.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => !n.readAt && markRead(n.id)}
          className={`cursor-pointer rounded-xl p-4 shadow-sm transition hover:shadow-md ${
            n.readAt ? 'bg-white' : 'bg-brand-accent/5 border border-brand-accent/20'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${n.readAt ? 'text-brand-muted' : 'text-brand-primary'}`}>
              {n.title}
            </p>
            {!n.readAt && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent mt-1.5" />
            )}
          </div>
          <p className="mt-1 text-xs text-brand-muted">{n.body}</p>
          <p className="mt-1 text-xs text-brand-muted/60">
            {new Date(n.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Main Profile page ───────────────────────────────────────

const TABS = [
  { id: 'trips', label: 'My Trips', icon: MapPin },
  { id: 'packages', label: 'My Packages', icon: Package },
  { id: 'deliveries', label: 'Deliveries', icon: Truck },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

function Profile() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'trips'

  if (!user) return null

  const status = statusConfig[user.accountStatus as keyof typeof statusConfig]
  const StatusIcon = status?.icon

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* Status banner for non-approved */}
      {user.accountStatus !== 'APPROVED' && status && (
        <div className={`mb-6 rounded-xl border ${status.border} ${status.bg} p-5`}>
          <div className="flex items-start gap-3">
            <StatusIcon className={`mt-0.5 h-5 w-5 shrink-0 ${status.color}`} />
            <div>
              <p className={`font-semibold ${status.color}`}>
                {status.label} — Afghanistan Online Cargo
              </p>
              <p className="mt-1 text-sm text-brand-muted">{status.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-2xl font-bold text-brand-primary">
            {user.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-primary">{user.nickname}</h1>
            <p className="text-sm text-brand-muted">{user.email}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              user.accountStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
              user.accountStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {status?.label || user.accountStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Only show tabs for approved users */}
      {user.accountStatus === 'APPROVED' ? (
        <>
          {/* Tabs */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-brand-primary text-white'
                      : 'text-brand-muted hover:text-brand-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'trips' && <MyTrips />}
            {activeTab === 'packages' && <MyPackages />}
            {activeTab === 'deliveries' && <MyDeliveries />}
            {activeTab === 'messages' && <MyMessages />}
            {activeTab === 'notifications' && <MyNotifications />}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-brand-muted">
            Your profile tabs will be available once your account is approved.
          </p>
        </div>
      )}
    </div>
  )
}

export default Profile