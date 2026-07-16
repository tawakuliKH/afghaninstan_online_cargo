import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  firstName?: string | null
  lastName?: string | null
  profileCompleted: boolean
  hasGoogleAuth?: boolean
  documentType: string | null
  documentNumber: string | null
  currentCountry: string | null
  currentCity: string | null
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
  const { t } = useTranslation()
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
        {t('admin.pagination', { page, totalPages })}
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
  const { t } = useTranslation()
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
      .catch(() => toast.error(t('admin.deliveryModal.toastLoadFailed')))
      .finally(() => setLoading(false))
  }, [deliveryId, t])

  const markPaid = async () => {
    setActionLoading(true)
    try {
      await api.patch(`/admin/deliveries/${deliveryId}/commission-paid`)
      toast.success(t('admin.deliveryModal.toastMarkPaidSuccess'))
      onChanged()
      onClose()
    } catch {
      toast.error(t('admin.deliveryModal.toastMarkPaidFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('admin.deliveryModal.confirmDelete'))) return
    setActionLoading(true)
    try {
      await api.delete(`/admin/deliveries/${deliveryId}`)
      toast.success(t('admin.deliveryModal.toastDeleteSuccess'))
      onChanged()
      onClose()
    } catch {
      toast.error(t('admin.deliveryModal.toastDeleteFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-brand-primary">{t('admin.deliveryModal.title')}</h3>
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
                {delivery.package?.title ?? t('admin.deliveryModal.unknownPackage')}
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DELIVERY_STATUS_COLORS[delivery.status] ?? ''}`}>
                {delivery.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-brand-muted">{t('admin.deliveryModal.sender')}</p>
                <p className="text-brand-primary">{delivery.sender?.nickname} ({delivery.sender?.email})</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">{t('admin.deliveryModal.traveler')}</p>
                <p className="text-brand-primary">{delivery.traveler?.nickname} ({delivery.traveler?.email})</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">{t('admin.deliveryModal.agreedAmount')}</p>
                <p className="text-brand-primary">{delivery.agreedAmount} {delivery.currency}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">{t('admin.deliveryModal.paymentLocation')}</p>
                <p className="text-brand-primary">{delivery.paymentLocation}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">{t('admin.deliveryModal.commission')}</p>
                <p className="text-brand-primary">
                  {delivery.commissionAmount != null ? `${delivery.commissionAmount} ${delivery.currency}` : '—'}
                  {delivery.commissionAmount != null && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${delivery.commissionPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-brand-danger'}`}>
                      {delivery.commissionPaid ? t('admin.deliveryModal.paid') : t('admin.deliveryModal.unpaid')}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">{t('admin.deliveryModal.estDelivery')}</p>
                <p className="text-brand-primary">
                  {delivery.estimatedDeliveryDate ? new Date(delivery.estimatedDeliveryDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">{t('admin.deliveryModal.finalized')}</p>
                <p className="text-brand-primary">
                  {delivery.finalizedAt ? new Date(delivery.finalizedAt).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            {acceptances.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-brand-muted">{t('admin.deliveryModal.agreementAcceptances')}</p>
                <div className="space-y-1">
                  {acceptances.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-brand-bg px-3 py-2 text-xs">
                      <span className="text-brand-primary">{a.type}</span>
                      <span className="text-brand-muted">
                        {a.acceptedAt
                          ? t('admin.deliveryModal.acceptedOn', { date: new Date(a.acceptedAt).toLocaleDateString() })
                          : t('admin.deliveryModal.notYetAccepted')}
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
                  <CheckCheck className="h-4 w-4" /> {t('admin.deliveryModal.markPaid')}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> {t('admin.deliveryModal.delete')}
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
  const { t } = useTranslation()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [kycUrls, setKycUrls] = useState<KycUrls | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users?status=PENDING')
      const sorted = [...res.data.users].sort(
        (a: AdminUser, b: AdminUser) => Number(b.profileCompleted) - Number(a.profileCompleted)
      )
      setUsers(sorted)
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
      toast.error(t('admin.pending.toastLoadKycFailed'))
    }
  }

  const handleApprove = async (id: string) => {
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${id}/approve`)
      toast.success(t('admin.pending.toastApproveSuccess'))
      setSelectedUser(null)
      fetchUsers()
    } catch {
      toast.error(t('admin.pending.toastApproveFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error(t('admin.pending.toastEnterReason'))
      return
    }
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${id}/reject`, { reason: rejectReason })
      toast.success(t('admin.pending.toastRejectSuccess'))
      setSelectedUser(null)
      setRejectReason('')
      fetchUsers()
    } catch {
      toast.error(t('admin.pending.toastRejectFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspend = async (id: string) => {
    setActionLoading(true)
    try {
      await api.patch(`/admin/users/${id}/suspend`)
      toast.success(t('admin.pending.toastSuspendSuccess'))
      setSelectedUser(null)
      fetchUsers()
    } catch {
      toast.error(t('admin.pending.toastSuspendFailed'))
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
          {t('admin.pending.title', { count: users.length })}
        </h3>
        {users.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm text-brand-muted">{t('admin.pending.none')}</p>
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
                      {u.profileCompleted ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                          {t('admin.pending.complete')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-orange-700">
                          {t('admin.pending.incomplete')}
                        </span>
                      )}
                      {u.adminNote?.includes('DELETION_REQUESTED') && (
                        <span className="rounded-full bg-brand-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-danger">
                          {t('admin.pending.deletionRequested')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted">{u.email}</p>
                    {u.profileCompleted ? (
                      <p className="text-xs text-brand-muted">
                        {u.documentType}: {u.documentNumber}
                      </p>
                    ) : (
                      <p className="text-xs text-orange-600">
                        {t('admin.pending.awaitingProfile')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-muted">
                      {u.currentCity ? `${u.currentCity}, ${u.currentCountry}` : '—'}
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
            {t('admin.pending.reviewOf', { name: selectedUser.legalFullName })}
          </h3>

          <div className="mb-4 space-y-2 text-sm">
            <p>
              <span className="text-brand-muted">{t('admin.pending.email')}</span>
              {selectedUser.email}
            </p>
            <p>
              <span className="text-brand-muted">{t('admin.pending.name')}</span>
              {selectedUser.firstName} {selectedUser.lastName}
            </p>
            <p>
              <span className="text-brand-muted">{t('admin.pending.nickname')}</span>
              {selectedUser.nickname}
            </p>
            <p>
              <span className="text-brand-muted">{t('admin.pending.profile')}</span>
              {selectedUser.profileCompleted ? (
                <span className="font-medium text-green-700">{t('admin.pending.complete')}</span>
              ) : (
                <span className="font-medium text-orange-700">{t('admin.pending.incomplete')}</span>
              )}
            </p>
            <p>
              <span className="text-brand-muted">{t('admin.pending.googleSignIn')}</span>
              {selectedUser.hasGoogleAuth ? t('admin.pending.yes') : t('admin.pending.no')}
            </p>
            {selectedUser.profileCompleted && (
              <>
                <p>
                  <span className="text-brand-muted">{t('admin.pending.document')}</span>
                  {selectedUser.documentType} — {selectedUser.documentNumber}
                </p>
                <p>
                  <span className="text-brand-muted">{t('admin.pending.location')}</span>
                  {selectedUser.currentCity}, {selectedUser.currentCountry}
                </p>
              </>
            )}
          </div>

          {/* KYC documents */}
          <div className="mb-4 space-y-3">
            <p className="text-xs font-semibold uppercase text-brand-muted">
              {t('admin.pending.kycDocuments')}
            </p>
            {!selectedUser.profileCompleted ? (
              <p className="text-xs text-orange-600">
                {t('admin.pending.awaitingProfile')}
              </p>
            ) : kycUrls === null ? (
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <Loader2 className="h-3 w-3 animate-spin" /> {t('admin.pending.loadingDocuments')}
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
                      {t('admin.pending.viewPassport')}
                      <span className="ml-auto text-brand-muted">{t('admin.pending.expiresIn5Min')}</span>
                  </a>
                  <a
                      href={kycUrls.face}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-brand-muted/20 px-3 py-2 text-xs text-brand-primary hover:bg-brand-bg"
                  >
                      <Eye className="h-3 w-3" />
                      {t('admin.pending.viewFace')}
                      <span className="ml-auto text-brand-muted">{t('admin.pending.expiresIn5Min')}</span>
                  </a>
                  {kycUrls.visa !== null && (
                      <a
                          href={kycUrls.visa}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-brand-muted/20 px-3 py-2 text-xs text-brand-primary hover:bg-brand-bg"
                      >
                          <Eye className="h-3 w-3" />
                          {t('admin.pending.viewVisa')}
                          <span className="ml-auto text-brand-muted">{t('admin.pending.expiresIn5Min')}</span>
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
                {t('admin.pending.deleteAccountRequest')}
              </button>
            )}
            <><div className="flex gap-2">
                  <button
                      onClick={() => handleApprove(selectedUser.id)}
                      disabled={actionLoading || !selectedUser.profileCompleted}
                      title={!selectedUser.profileCompleted ? t('admin.pending.approveTooltip') : undefined}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                      {actionLoading
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <CheckCircle className="h-4 w-4" />}
                      {t('admin.pending.approve')}
                  </button>
                  <button
                      onClick={() => handleSuspend(selectedUser.id)}
                      disabled={actionLoading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                      <AlertTriangle className="h-4 w-4" />
                      {t('admin.pending.suspend')}
                  </button>
              </div><div className="space-y-2">
                      <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder={t('admin.pending.rejectReasonPlaceholder')}
                          rows={2}
                          className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm outline-none focus:border-brand-danger" />
                      <button
                          onClick={() => handleReject(selectedUser.id)}
                          disabled={actionLoading || !rejectReason.trim()}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                          <XCircle className="h-4 w-4" />
                          {t('admin.pending.reject')}
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
  const { t } = useTranslation()
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
    if (!confirm(t('admin.allUsers.confirmDelete'))) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success(t('admin.allUsers.toastDeleteSuccess'))
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('admin.allUsers.toastDeleteFailed'))
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
          <option value="">{t('admin.allUsers.allStatuses')}</option>
          <option value="PENDING">{t('admin.allUsers.statusPending')}</option>
          <option value="APPROVED">{t('admin.allUsers.statusApproved')}</option>
          <option value="REJECTED">{t('admin.allUsers.statusRejected')}</option>
          <option value="SUSPENDED">{t('admin.allUsers.statusSuspended')}</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t('admin.allUsers.searchPlaceholder')}
            className="w-full rounded-lg border border-brand-muted/30 bg-white py-2 pl-9 pr-3 text-sm text-brand-primary outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState label={t('admin.allUsers.noneFound')} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-primary/5 text-xs uppercase text-brand-muted">
                <tr>
                  <th className="px-4 py-3 text-left">{t('admin.allUsers.colName')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.allUsers.colEmail')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.allUsers.colDocument')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.allUsers.colLocation')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.allUsers.colProfile')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.allUsers.colStatus')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.allUsers.colJoined')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.allUsers.colActions')}</th>
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
                    <td className="px-4 py-3 text-brand-muted">{u.documentType ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-muted">
                      {u.currentCity ? `${u.currentCity}, ${u.currentCountry}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.profileCompleted ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {t('admin.pending.complete')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                          {t('admin.pending.incomplete')}
                        </span>
                      )}
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
  const { t } = useTranslation()
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
    if (!confirm(t('admin.packages.confirmDelete'))) return
    try {
      await api.delete(`/admin/packages/${id}`)
      toast.success(t('admin.packages.toastDeleteSuccess'))
      fetchPackages()
    } catch {
      toast.error(t('admin.packages.toastDeleteFailed'))
    }
  }

  return (
    <div>
      <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder={t('admin.packages.searchPlaceholder')} />

      {loading ? (
        <Spinner />
      ) : packages.length === 0 ? (
        <EmptyState label={t('admin.packages.noneFound')} />
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
                      {pkg.originCity} → {pkg.destCity} · {t('admin.packages.senderLabel', { name: pkg.sender?.nickname ?? t('admin.packages.unknown') })}
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
  const { t } = useTranslation()
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
    if (!confirm(t('admin.trips.confirmDelete'))) return
    try {
      await api.delete(`/admin/trips/${id}`)
      toast.success(t('admin.trips.toastDeleteSuccess'))
      fetchTrips()
    } catch {
      toast.error(t('admin.trips.toastDeleteFailed'))
    }
  }

  return (
    <div>
      <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder={t('admin.trips.searchPlaceholder')} />

      {loading ? (
        <Spinner />
      ) : trips.length === 0 ? (
        <EmptyState label={t('admin.trips.noneFound')} />
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
                      {t('admin.trips.departsLabel', {
                        date: new Date(trip.departureDate).toLocaleDateString(),
                        name: trip.traveler?.nickname ?? t('admin.packages.unknown'),
                      })}
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
  const { t } = useTranslation()
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
    if (!confirm(t('admin.deliveries.confirmDelete'))) return
    try {
      await api.delete(`/admin/deliveries/${id}`)
      toast.success(t('admin.deliveries.toastDeleteSuccess'))
      fetchDeliveries()
    } catch {
      toast.error(t('admin.deliveries.toastDeleteFailed'))
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
        <EmptyState label={t('admin.deliveries.noneFound')} />
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
                      {d.package?.title ?? t('admin.deliveryModal.unknownPackage')}
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
  const { t } = useTranslation()
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
      toast.success(t('admin.delivered.toastMarkPaidSuccess'))
      fetchDeliveries()
    } catch {
      toast.error(t('admin.delivered.toastMarkPaidFailed'))
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
        <EmptyState label={t('admin.delivered.noneYet')} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-primary/5 text-xs uppercase text-brand-muted">
                <tr>
                  <th className="px-4 py-3 text-left">{t('admin.delivered.colPackage')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.delivered.colTraveler')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.delivered.colSender')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.delivered.colAmount')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.delivered.colCommission')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.delivered.colFinalized')}</th>
                  <th className="px-4 py-3 text-left">{t('admin.delivered.colActions')}</th>
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
                      {d.package?.title ?? t('admin.deliveryModal.unknownPackage')}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{d.traveler?.nickname}</td>
                    <td className="px-4 py-3 text-brand-muted">{d.sender?.nickname}</td>
                    <td className="px-4 py-3 text-brand-muted">{d.agreedAmount} {d.currency}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.commissionPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-brand-danger'}`}>
                        {d.commissionAmount} {d.currency} · {d.commissionPaid ? t('admin.deliveryModal.paid') : t('admin.deliveryModal.unpaid')}
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
                          {t('admin.delivered.markPaid')}
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
  const { t } = useTranslation()
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
    if (!confirm(t('admin.messages.confirmDelete'))) return
    try {
      await api.delete(`/admin/messages/${id}`)
      setThreadMessages((prev) => prev.filter((m) => m.id !== id))
      toast.success(t('admin.messages.toastDeleteSuccess'))
      fetchConversations()
    } catch {
      toast.error(t('admin.messages.toastDeleteFailed'))
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-4 font-semibold text-brand-primary">
          {t('admin.messages.conversationsTitle', { count: conversations.length })}
        </h3>
        {conversations.length === 0 ? (
          <EmptyState label={t('admin.messages.noneYet')} />
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
                  <span className="text-xs text-brand-muted">{t('admin.messages.messagesCount', { count: c.count })}</span>
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

function AdminDashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data))
  }, [])

  if (!user?.isAdmin) return <Navigate to="/" replace />

  const TABS = [
    { id: 'pending', label: t('admin.tabs.pending'), icon: Clock },
    { id: 'users', label: t('admin.tabs.users'), icon: Users },
    { id: 'packages', label: t('admin.tabs.packages'), icon: Package },
    { id: 'trips', label: t('admin.tabs.trips'), icon: MapPin },
    { id: 'deliveries', label: t('admin.tabs.deliveries'), icon: Truck },
    { id: 'delivered', label: t('admin.tabs.delivered'), icon: CheckCheck },
    { id: 'messages', label: t('admin.tabs.messages'), icon: MessageSquare },
  ]

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
        <h1 className="text-2xl font-bold text-brand-primary">{t('admin.dashboard.title')}</h1>
        <p className="text-sm text-brand-muted">
          {t('admin.dashboard.subtitle')}
        </p>
      </div>

      {/* Stats */}
      {stats !== null && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label={t('admin.dashboard.statTotalUsers')}
            value={stats.totalUsers}
            color="bg-brand-primary/10 text-brand-primary"
          />
          <StatCard
            icon={Clock}
            label={t('admin.dashboard.statPending')}
            value={stats.pendingUsers}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            icon={MapPin}
            label={t('admin.dashboard.statTotalTrips')}
            value={stats.totalTrips}
            color="bg-brand-secondary/10 text-brand-secondary"
          />
          <StatCard
            icon={Package}
            label={t('admin.dashboard.statTotalPackages')}
            value={stats.totalPackages}
            color="bg-brand-accent/10 text-brand-accent"
          />
          <StatCard
            icon={Truck}
            label={t('admin.dashboard.statDeliveries')}
            value={stats.totalDeliveries}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={CheckCircle}
            label={t('admin.dashboard.statFinalized')}
            value={stats.finalizedDeliveries}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={DollarSign}
            label={t('admin.dashboard.statUnpaidCommission')}
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
