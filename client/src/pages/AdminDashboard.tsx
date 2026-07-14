import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import {
  Users, Package, MapPin, Truck, DollarSign,
  Clock, CheckCircle, XCircle, Loader2, Eye,
  AlertTriangle, Trash2, Search, ChevronLeft, ChevronRight,
  MessageSquare, X, CheckCheck
} from 'lucide-react'
import { SEO } from '../components/SEO'

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
  adminNote?: string | null
}

interface AdminPackage {
  id: string
  title: string
  weight: number
  originCity: string
  originCountry: string
  destCity: string
  destCountry: string
  createdAt: string
  sender: { id: string; nickname: string; email: string } | null
}

interface AdminTrip {
  id: string
  originCity: string
  originCountry: string
  destCity: string
  destCountry: string
  departureDate: string
  createdAt: string
  traveler: { id: string; nickname: string; email: string } | null
}

interface Delivery {
  id: string
  status: string
  agreedAmount: number
  currency: string
  paymentLocation: string
  estimatedDeliveryDate: string | null
  finalizedAt: string | null
  commissionPaid: boolean
  commissionAmount: number | null
  package: { id: string; title: string } | null
  sender: { id: string; nickname: string; email: string } | null
  traveler: { id: string; nickname: string; email: string } | null
}

interface ConversationSummary {
  userA: { id: string; nickname: string }
  userB: { id: string; nickname: string }
  lastMessage: { id: string; content: string; createdAt: string }
  count: number
}

interface ThreadMessage {
  id: string
  content: string
  createdAt: string
  readAt: string | null
  sender: { id: string; nickname: string }
  receiver: { id: string; nickname: string }
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

const DELIVERY_STATUS_COLORS: Record<string, string> = {
  PROPOSED: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  FINALIZED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-white p-8 text-center shadow-sm">
      <p className="text-sm text-brand-muted">{label}</p>
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 border-t border-brand-muted/10 p-4">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-brand-muted">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-brand-muted/30 bg-white py-2 pl-9 pr-3 text-sm text-brand-primary outline-none focus:border-brand-primary"
      />
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

// ── Delivery detail modal (shared by Deliveries + Delivered Packages tabs) ──

function DeliveryDetailModal({
  deliveryId,
  onClose,
  onChanged,
}: {
  deliveryId: string
  onClose: () => void
  onChanged: () => void
}) {
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [acceptances, setAcceptances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    api
      .get(`/admin/deliveries/${deliveryId}`)
      .then((res) => {
        setDelivery(res.data.delivery)
        setAcceptances(res.data.agreementAcceptances)
      })
      .catch(() => toast.error('Failed to load delivery'))
      .finally(() => setLoading(false))
  }, [deliveryId])

  const markPaid = async () => {
    setActionLoading(true)
    try {
      await api.patch(`/admin/deliveries/${deliveryId}/commission-paid`)
      toast.success('Commission marked as paid')
      onChanged()
      onClose()
    } catch {
      toast.error('Failed to mark commission as paid')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this delivery? This cannot be undone.')) return
    setActionLoading(true)
    try {
      await api.delete(`/admin/deliveries/${deliveryId}`)
      toast.success('Delivery deleted')
      onChanged()
      onClose()
    } catch {
      toast.error('Failed to delete delivery')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-brand-primary">Delivery Detail</h3>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !delivery ? (
          <Spinner />
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium text-brand-primary">
                {delivery.package?.title ?? 'Unknown package'}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DELIVERY_STATUS_COLORS[delivery.status] ?? ''}`}>
                {delivery.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-brand-muted">Sender</p>
                <p className="text-brand-primary">{delivery.sender?.nickname} ({delivery.sender?.email})</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Traveler</p>
                <p className="text-brand-primary">{delivery.traveler?.nickname} ({delivery.traveler?.email})</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Agreed amount</p>
                <p className="text-brand-primary">{delivery.agreedAmount} {delivery.currency}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Payment location</p>
                <p className="text-brand-primary">{delivery.paymentLocation}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Commission</p>
                <p className="text-brand-primary">
                  {delivery.commissionAmount != null ? `${delivery.commissionAmount} ${delivery.currency}` : '—'}
                  {delivery.commissionAmount != null && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${delivery.commissionPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-brand-danger'}`}>
                      {delivery.commissionPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Est. delivery</p>
                <p className="text-brand-primary">
                  {delivery.estimatedDeliveryDate ? new Date(delivery.estimatedDeliveryDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Finalized</p>
                <p className="text-brand-primary">
                  {delivery.finalizedAt ? new Date(delivery.finalizedAt).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            {acceptances.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-brand-muted">Agreement Acceptances</p>
                <div className="space-y-1">
                  {acceptances.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-brand-bg px-3 py-2 text-xs">
                      <span className="text-brand-primary">{a.type}</span>
                      <span className="text-brand-muted">
                        {a.acceptedAt ? `Accepted ${new Date(a.acceptedAt).toLocaleDateString()}` : 'Not yet accepted'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 border-t border-brand-muted/10 pt-4">
              {delivery.status === 'FINALIZED' && !delivery.commissionPaid && (
                <button
                  onClick={markPaid}
                  disabled={actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  <CheckCheck className="h-4 w-4" /> Mark Commission Paid
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        )}
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-brand-primary">{u.legalFullName}</p>
                      {u.adminNote?.includes('DELETION_REQUESTED') && (
                        <span className="rounded-full bg-brand-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-danger">
                          Deletion Requested
                        </span>
                      )}
                    </div>
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
            {selectedUser.adminNote?.includes('DELETION_REQUESTED') && (
              <button
                onClick={() => handleSuspend(selectedUser.id)}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account (per user request)
              </button>
            )}
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
  const navigate = useNavigate()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await api.get(`/admin/users?${params.toString()}`)
      setUsers(res.data.users)
      setTotalPages(res.data.pagination.totalPages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, statusFilter, search])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete (suspend) this user? Their history will be preserved.')) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('User deleted')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete user')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-brand-muted/30 bg-white py-2 pl-9 pr-3 text-sm text-brand-primary outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState label="No users found" />
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
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-muted/10">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => navigate(`/users/${u.id}`)}
                    className="cursor-pointer hover:bg-brand-bg"
                  >
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
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDelete(e, u.id)}
                        className="text-brand-muted hover:text-brand-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  )
}

// ── Packages ─────────────────────────────────────────────────

function AdminPackages() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState<AdminPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      const res = await api.get(`/admin/packages?${params.toString()}`)
      setPackages(res.data.packages)
      setTotalPages(res.data.pagination.totalPages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPackages() }, [page, search])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this package? This cannot be undone.')) return
    try {
      await api.delete(`/admin/packages/${id}`)
      toast.success('Package deleted')
      fetchPackages()
    } catch {
      toast.error('Failed to delete package')
    }
  }

  return (
    <div>
      <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by title..." />

      {loading ? (
        <Spinner />
      ) : packages.length === 0 ? (
        <EmptyState label="No packages found" />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="divide-y divide-brand-muted/10">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => navigate(`/packages/${pkg.id}`)}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition hover:bg-brand-bg"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 shrink-0 text-brand-accent" />
                  <div>
                    <p className="font-medium text-brand-primary">{pkg.title}</p>
                    <p className="text-xs text-brand-muted">
                      {pkg.originCity} → {pkg.destCity} · Sender: {pkg.sender?.nickname ?? 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-brand-muted">
                    {new Date(pkg.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, pkg.id)}
                    className="text-brand-muted hover:text-brand-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  )
}

// ── Trips ────────────────────────────────────────────────────

function AdminTrips() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<AdminTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  const fetchTrips = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set('search', search)
      const res = await api.get(`/admin/trips?${params.toString()}`)
      setTrips(res.data.trips)
      setTotalPages(res.data.pagination.totalPages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrips() }, [page, search])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this trip? This cannot be undone.')) return
    try {
      await api.delete(`/admin/trips/${id}`)
      toast.success('Trip deleted')
      fetchTrips()
    } catch {
      toast.error('Failed to delete trip')
    }
  }

  return (
    <div>
      <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by city..." />

      {loading ? (
        <Spinner />
      ) : trips.length === 0 ? (
        <EmptyState label="No trips found" />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="divide-y divide-brand-muted/10">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition hover:bg-brand-bg"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 shrink-0 text-brand-accent" />
                  <div>
                    <p className="font-medium text-brand-primary">
                      {trip.originCity} → {trip.destCity}
                    </p>
                    <p className="text-xs text-brand-muted">
                      Departs {new Date(trip.departureDate).toLocaleDateString()} · Traveler: {trip.traveler?.nickname ?? 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-brand-muted">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, trip.id)}
                    className="text-brand-muted hover:text-brand-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  )
}

// ── Deliveries (all) ─────────────────────────────────────────

function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchDeliveries = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/deliveries?page=${page}`)
      setDeliveries(res.data.deliveries)
      setTotalPages(res.data.pagination.totalPages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDeliveries() }, [page])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this delivery? This cannot be undone.')) return
    try {
      await api.delete(`/admin/deliveries/${id}`)
      toast.success('Delivery deleted')
      fetchDeliveries()
    } catch {
      toast.error('Failed to delete delivery')
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      {selectedId && (
        <DeliveryDetailModal
          deliveryId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={fetchDeliveries}
        />
      )}
      {deliveries.length === 0 ? (
        <EmptyState label="No deliveries found" />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="divide-y divide-brand-muted/10">
            {deliveries.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition hover:bg-brand-bg"
              >
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 shrink-0 text-brand-accent" />
                  <div>
                    <p className="font-medium text-brand-primary">
                      {d.package?.title ?? 'Unknown package'}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {d.sender?.nickname} → {d.traveler?.nickname} · {d.agreedAmount} {d.currency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DELIVERY_STATUS_COLORS[d.status] ?? ''}`}>
                    {d.status}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, d.id)}
                    className="text-brand-muted hover:text-brand-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  )
}

// ── Delivered Packages ───────────────────────────────────────

function DeliveredPackages() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchDeliveries = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/deliveries?page=${page}&status=FINALIZED`)
      setDeliveries(res.data.deliveries)
      setTotalPages(res.data.pagination.totalPages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDeliveries() }, [page])

  const markPaid = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
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
      {selectedId && (
        <DeliveryDetailModal
          deliveryId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={fetchDeliveries}
        />
      )}
      {deliveries.length === 0 ? (
        <EmptyState label="No delivered packages yet" />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-primary/5 text-xs uppercase text-brand-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Traveler</th>
                  <th className="px-4 py-3 text-left">Sender</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Commission</th>
                  <th className="px-4 py-3 text-left">Finalized</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-muted/10">
                {deliveries.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className="cursor-pointer hover:bg-brand-bg"
                  >
                    <td className="px-4 py-3 font-medium text-brand-primary">
                      {d.package?.title ?? 'Unknown package'}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{d.traveler?.nickname}</td>
                    <td className="px-4 py-3 text-brand-muted">{d.sender?.nickname}</td>
                    <td className="px-4 py-3 text-brand-muted">{d.agreedAmount} {d.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.commissionPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-brand-danger'}`}>
                        {d.commissionAmount} {d.currency} · {d.commissionPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">
                      {d.finalizedAt ? new Date(d.finalizedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {!d.commissionPaid && (
                        <button
                          onClick={(e) => markPaid(e, d.id)}
                          className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  )
}

// ── Messages / Chats ─────────────────────────────────────────

function AdminMessages() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [thread, setThread] = useState<{ userAId: string; userBId: string; label: string } | null>(null)
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/messages')
      setConversations(res.data.conversations)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConversations() }, [])

  const openThread = async (c: ConversationSummary) => {
    setThread({
      userAId: c.userA.id,
      userBId: c.userB.id,
      label: `${c.userA.nickname} ↔ ${c.userB.nickname}`,
    })
    setThreadLoading(true)
    try {
      const res = await api.get(`/admin/messages/thread/${c.userA.id}/${c.userB.id}`)
      setThreadMessages(res.data.messages)
    } finally {
      setThreadLoading(false)
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return
    try {
      await api.delete(`/admin/messages/${id}`)
      setThreadMessages((prev) => prev.filter((m) => m.id !== id))
      toast.success('Message deleted')
      fetchConversations()
    } catch {
      toast.error('Failed to delete message')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-4 font-semibold text-brand-primary">
          Conversations ({conversations.length})
        </h3>
        {conversations.length === 0 ? (
          <EmptyState label="No conversations yet" />
        ) : (
          <div className="space-y-2">
            {conversations.map((c, i) => (
              <div
                key={i}
                onClick={() => openThread(c)}
                className={`cursor-pointer rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md ${
                  thread && thread.userAId === c.userA.id && thread.userBId === c.userB.id
                    ? 'ring-2 ring-brand-primary'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-medium text-brand-primary">
                    <MessageSquare className="h-4 w-4 text-brand-accent" />
                    {c.userA.nickname} ↔ {c.userB.nickname}
                  </p>
                  <span className="text-xs text-brand-muted">{c.count} messages</span>
                </div>
                <p className="mt-2 truncate text-xs text-brand-muted">{c.lastMessage.content}</p>
                <p className="mt-1 text-xs text-brand-muted/60">
                  {new Date(c.lastMessage.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {thread && (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-4 font-semibold text-brand-primary">{thread.label}</h3>
          {threadLoading ? (
            <Spinner />
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {threadMessages.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-2 rounded-lg bg-brand-bg px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-brand-primary">{m.sender.nickname}</p>
                    <p className="text-sm text-brand-primary">{m.content}</p>
                    <p className="mt-1 text-xs text-brand-muted">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className="shrink-0 text-brand-muted hover:text-brand-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────

const TABS = [
  { id: 'pending', label: 'Pending Approvals', icon: Clock },
  { id: 'users', label: 'All Users', icon: Users },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'trips', label: 'Trips', icon: MapPin },
  { id: 'deliveries', label: 'Deliveries', icon: Truck },
  { id: 'delivered', label: 'Delivered Packages', icon: CheckCheck },
  { id: 'messages', label: 'Chats', icon: MessageSquare },
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
      <SEO
        titleEn="Admin Dashboard"
        titleFa="داشبورد مدیریت"
        descriptionEn="Platform administration and oversight."
        descriptionFa="مدیریت و نظارت پلتفرم."
        path="/admin"
        noIndex
      />
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
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm">
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
      {activeTab === 'packages' && <AdminPackages />}
      {activeTab === 'trips' && <AdminTrips />}
      {activeTab === 'deliveries' && <AdminDeliveries />}
      {activeTab === 'delivered' && <DeliveredPackages />}
      {activeTab === 'messages' && <AdminMessages />}
    </div>
  )
}

export default AdminDashboard
