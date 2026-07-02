import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import {
  Users, Package, MapPin, Truck, DollarSign,
  Clock, CheckCircle, XCircle, Loader2, Eye,
  AlertTriangle
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────

interface Stats {
  totalUsers: number
  pendingUsers: number
  totalTrips: number
  totalPackages: number
  totalDeliveries: number
  finalizedDeliveries: number
  unpaidCommissions: number
}

interface AdminUser {
  id: string
  email: string
  legalFullName: string
  nickname: string
  documentType: string
  documentNumber: string
  currentCountry: string
  currentCity: string
  accountStatus: string
  createdAt: string
}

interface Delivery {
  id: string
  status: string
  commissionPaid: boolean
  commissionAmount: number
  currency: string
  package: { title: string } | null
  traveler: { nickname: string; email: string } | null
}

interface KycUrls {
  passport: string
  face: string
  visa: string | null
}

// ── Helpers ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-brand-primary">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

// ── Pending Users ────────────────────────────────────────────

function PendingUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [kycUrls, setKycUrls] = useState<KycUrls | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users?status=PENDING')
      setUsers(res.data.users)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const viewUser = async (u: AdminUser) => {
    setSelectedUser(u)
    setKycUrls(null)
    try {
      const res = await api.get(`/admin/users/${u.id}`)
      setKycUrls({
        passport: res.data.user.passportPhotoUrl,
        face: res.data.user.facePhotoUrl,
        visa: res.data.user.visaResidencyDocUrl ?? null,
      })
    } catch {
      toast.error('Failed to load KYC documents')
    }
  }

  const handleApprove = async (id: string) => {
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${id}/approve`)
      toast.success('User approved')
      setSelectedUser(null)
      fetchUsers()
    } catch {
      toast.error('Failed to approve user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${id}/reject`, { reason: rejectReason })
      toast.success('User rejected')
      setSelectedUser(null)
      setRejectReason('')
      fetchUsers()
    } catch {
      toast.error('Failed to reject user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspend = async (id: string) => {
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${id}/suspend`)
      toast.success('User suspended')
      setSelectedUser(null)
      fetchUsers()
    } catch {
      toast.error('Failed to suspend user')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* User list */}
      <div>
        <h3 className="mb-4 font-semibold text-brand-primary">
          Pending Accounts ({users.length})
        </h3>
        {users.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm text-brand-muted">No pending accounts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                onClick={() => viewUser(u)}
                className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md ${
                  selectedUser?.id === u.id ? 'ring-2 ring-brand-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-brand-primary">{u.legalFullName}</p>
                    <p className="text-xs text-brand-muted">{u.email}</p>
                    <p className="text-xs text-brand-muted">
                      {u.documentType}: {u.documentNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-muted">
                      {u.currentCity}, {u.currentCountry}
                    </p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                    <Eye className="ml-auto mt-1 h-4 w-4 text-brand-accent" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedUser !== null && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-brand-primary">
            Review: {selectedUser.legalFullName}
          </h3>

          <div className="mb-4 space-y-2 text-sm">
            <p>
              <span className="text-brand-muted">Email: </span>
              {selectedUser.email}
            </p>
            <p>
              <span className="text-brand-muted">Nickname: </span>
              {selectedUser.nickname}
            </p>
            <p>
              <span className="text-brand-muted">Document: </span>
              {selectedUser.documentType} — {selectedUser.documentNumber}
            </p>
            <p>
              <span className="text-brand-muted">Location: </span>
              {selectedUser.currentCity}, {selectedUser.currentCountry}
            </p>
          </div>

          {/* KYC documents */}
          <div className="mb-4 space-y-3">
            <p className="text-xs font-semibold uppercase text-brand-muted">
              KYC Documents
            </p>
            {kycUrls === null ? (
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading documents...
              </div>
            ) : (
              <div className="space-y-2">
                  <a
                      href={kycUrls.passport}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-brand-muted/20 px-3 py-2 text-xs text-brand-primary hover:bg-brand-bg"
                  >
                      <Eye className="h-3 w-3" />
                      View Passport / Tazkira Photo
                      <span className="ml-auto text-brand-muted">(expires in 5 min)</span>
                  </a>
                  <a
                      href={kycUrls.face}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-brand-muted/20 px-3 py-2 text-xs text-brand-primary hover:bg-brand-bg"
                  >
                      <Eye className="h-3 w-3" />
                      View Face Photo
                      <span className="ml-auto text-brand-muted">(expires in 5 min)</span>
                  </a>
                  {kycUrls.visa !== null && (
                      <a
                          href={kycUrls.visa}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-brand-muted/20 px-3 py-2 text-xs text-brand-primary hover:bg-brand-bg"
                      >
                          <Eye className="h-3 w-3" />
                          View Visa / Residency Doc
                          <span className="ml-auto text-brand-muted">(expires in 5 min)</span>
                      </a>
                  )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <><div className="flex gap-2">
                  <button
                      onClick={() => handleApprove(selectedUser.id)}
                      disabled={actionLoading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                      {actionLoading
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <CheckCircle className="h-4 w-4" />}
                      Approve
                  </button>
                  <button
                      onClick={() => handleSuspend(selectedUser.id)}
                      disabled={actionLoading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                      <AlertTriangle className="h-4 w-4" />
                      Suspend
                  </button>
              </div><div className="space-y-2">
                      <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason (required to reject)"
                          rows={2}
                          className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-danger" />
                      <button
                          onClick={() => handleReject(selectedUser.id)}
                          disabled={actionLoading || !rejectReason.trim()}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                          <XCircle className="h-4 w-4" />
                          Reject
                      </button>
                  </div></>
          </div>
        </div>
      )}
    </div>
  )
}

// ── All Users ────────────────────────────────────────────────

function AllUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await api.get(`/admin/users?${params.toString()}`)
      setUsers(res.data.users)
      setTotalPages(res.data.pagination.totalPages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, statusFilter])

  return (
    <div>
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-brand-muted/30 bg-white px-3 py-2 text-sm text-brand-primary outline-none"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-primary/5 text-xs uppercase text-brand-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Document</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-muted/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-bg">
                    <td className="px-4 py-3 font-medium text-brand-primary">
                      {u.legalFullName}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{u.email}</td>
                    <td className="px-4 py-3 text-brand-muted">{u.documentType}</td>
                    <td className="px-4 py-3 text-brand-muted">
                      {u.currentCity}, {u.currentCountry}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[u.accountStatus] ?? ''}`}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 border-t border-brand-muted/10 p-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-brand-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Commissions ──────────────────────────────────────────────

function Commissions() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/admin/deliveries')
      const unpaid = res.data.deliveries.filter(
        (d: Delivery) => d.status === 'FINALIZED' && !d.commissionPaid
      )
      setDeliveries(unpaid)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDeliveries() }, [])

  const markPaid = async (id: string) => {
    try {
      await api.patch(`/admin/deliveries/${id}/commission-paid`)
      toast.success('Commission marked as paid')
      fetchDeliveries()
    } catch {
      toast.error('Failed to mark commission as paid')
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <h3 className="mb-4 font-semibold text-brand-primary">
        Unpaid Commissions ({deliveries.length})
      </h3>
      {deliveries.length === 0 ? (
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
          <p className="text-sm text-brand-muted">No unpaid commissions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => (
            <div key={d.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-brand-primary">
                    {d.package?.title ?? 'Unknown package'}
                  </p>
                  <p className="text-xs text-brand-muted">
                    Traveler: {d.traveler?.nickname} ({d.traveler?.email})
                  </p>
                  <p className="text-xs text-brand-muted">
                    Commission:{' '}
                    <span className="font-semibold text-brand-primary">
                      {d.commissionAmount} {d.currency}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => markPaid(d.id)}
                  className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  Mark Paid
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────

const TABS = [
  { id: 'pending', label: 'Pending Approvals', icon: Clock },
  { id: 'users', label: 'All Users', icon: Users },
  { id: 'commissions', label: 'Commissions', icon: DollarSign },
]

function AdminDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data))
  }, [])

  if (!user?.isAdmin) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-primary">Admin Dashboard</h1>
        <p className="text-sm text-brand-muted">
          Afghanistan Online Cargo — Administration
        </p>
      </div>

      {/* Stats */}
      {stats !== null && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="bg-brand-primary/10 text-brand-primary"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pendingUsers}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            icon={MapPin}
            label="Total Trips"
            value={stats.totalTrips}
            color="bg-brand-secondary/10 text-brand-secondary"
          />
          <StatCard
            icon={Package}
            label="Total Packages"
            value={stats.totalPackages}
            color="bg-brand-accent/10 text-brand-accent"
          />
          <StatCard
            icon={Truck}
            label="Deliveries"
            value={stats.totalDeliveries}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={CheckCircle}
            label="Finalized"
            value={stats.finalizedDeliveries}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={DollarSign}
            label="Unpaid Commission"
            value={stats.unpaidCommissions}
            color="bg-red-100 text-brand-danger"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-muted hover:text-brand-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'pending' && <PendingUsers />}
      {activeTab === 'users' && <AllUsers />}
      {activeTab === 'commissions' && <Commissions />}
    </div>
  )
}

export default AdminDashboard