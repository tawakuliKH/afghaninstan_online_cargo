import { AlertTriangle, CheckCircle, Info, X, Loader2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  variant?: 'danger' | 'warning' | 'success'
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}

const VARIANT_STYLES = {
  danger: {
    icon: AlertTriangle,
    iconWrap: 'bg-brand-danger/10',
    iconColor: 'text-brand-danger',
    confirmBtn: 'bg-brand-danger hover:opacity-90',
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    confirmBtn: 'bg-brand-accent hover:opacity-90',
  },
  success: {
    icon: CheckCircle,
    iconWrap: 'bg-green-100',
    iconColor: 'text-green-600',
    confirmBtn: 'bg-brand-secondary hover:opacity-90',
  },
} as const

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'warning',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}: Props) {
  if (!isOpen) return null

  const style = VARIANT_STYLES[variant] ?? VARIANT_STYLES.warning
  const Icon = style.icon ?? Info

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-brand-muted hover:text-brand-primary"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-start gap-3">
          <div className={`shrink-0 rounded-full p-2 ${style.iconWrap}`}>
            <Icon className={`h-5 w-5 ${style.iconColor}`} />
          </div>
          <div>
            <h2 className="font-bold text-brand-primary">{title}</h2>
            <p className="mt-1 text-sm text-brand-muted">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-brand-muted/30 px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-bg disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${style.confirmBtn}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
