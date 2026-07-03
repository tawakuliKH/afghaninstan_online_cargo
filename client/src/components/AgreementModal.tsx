import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, ExternalLink, CheckCircle, X, Loader2 } from 'lucide-react'
import api from '../lib/axios'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAccepted: () => void
  type: 'DELIVER_PACKAGE' | 'ACCEPT_DELIVERY'
  deliveryId: string
  role: 'sender' | 'traveler'
}

export function AgreementModal({ isOpen, onClose, onAccepted, type, deliveryId, role }: Props) {
  const { i18n } = useTranslation()
  const [hasOpened, setHasOpened] = useState(false)
  const [accepting, setAccepting] = useState(false)

  if (!isOpen) return null

  const handleOpenAgreement = async () => {
    try {
      await api.post('/agreements/opened', {
        type,
        deliveryId,
        version: '1.0',
      })
    } catch {
      // non-blocking — still let them open the doc
    }
    const lang = i18n.language === 'fa-AF' ? 'fa-AF' : 'en'
    const tab = role === 'sender' ? 'sender' : 'traveler'
    window.open(`/rules?tab=${tab}&lang=${lang}`, '_blank')
    setHasOpened(true)
  }

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await api.post('/agreements/accepted', {
        type,
        deliveryId,
        version: '1.0',
      })
      onAccepted()
    } catch (err: any) {
      console.error(err)
    } finally {
      setAccepting(false)
    }
  }

  const title = role === 'sender'
    ? 'Sender Agreement — Required'
    : 'Traveler Agreement — Required'

  const description = role === 'sender'
    ? 'Before marking this package as delivered to the traveler, you must read and agree to the Sender Terms. This creates a legally significant record of the handover.'
    : 'Before accepting this delivery request, you must read and agree to the Traveler Terms. This creates a legally significant record of your commitment to deliver.'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-brand-muted hover:text-brand-primary"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-full bg-brand-accent/10 p-2">
            <FileText className="h-5 w-5 text-brand-accent" />
          </div>
          <div>
            <h2 className="font-bold text-brand-primary">{title}</h2>
            <p className="mt-1 text-xs text-brand-muted">{description}</p>
          </div>
        </div>

        {/* Step 1 — Open agreement */}
        <div className={`mb-4 rounded-xl border p-4 transition ${
          hasOpened
            ? 'border-green-200 bg-green-50'
            : 'border-brand-muted/20 bg-brand-bg'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasOpened
                ? <CheckCircle className="h-4 w-4 text-green-500" />
                : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">1</span>
              }
              <p className="text-sm font-medium text-brand-primary">
                {hasOpened ? 'Agreement opened' : 'Open and read the agreement'}
              </p>
            </div>
            <button
              onClick={handleOpenAgreement}
              className="flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              <ExternalLink className="h-3 w-3" />
              {hasOpened ? 'Re-open' : 'Open'}
            </button>
          </div>
          {!hasOpened && (
            <p className="mt-2 text-xs text-brand-muted">
              The agreement will open in a new tab. Read it fully before proceeding.
            </p>
          )}
        </div>

        {/* Step 2 — Accept */}
        <div className={`rounded-xl border p-4 transition ${
          hasOpened
            ? 'border-brand-muted/20 bg-brand-bg'
            : 'border-brand-muted/10 bg-brand-muted/5 opacity-50'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
              hasOpened ? 'bg-brand-primary' : 'bg-brand-muted'
            }`}>2</span>
            <p className="text-sm font-medium text-brand-primary">
              Confirm you have read and agree
            </p>
          </div>
          <p className="mb-3 text-xs text-brand-muted">
            By clicking below, you confirm that you have read the full agreement and agree to be legally bound by its terms.
          </p>
          <button
            onClick={handleAccept}
            disabled={!hasOpened || accepting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CheckCircle className="h-4 w-4" />
            }
            I have read and agree to the {role === 'sender' ? 'Sender' : 'Traveler'} Terms
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-brand-muted">
          Afghanistan Online Cargo — Version 1.0 — July 2026
        </p>
      </div>
    </div>
  )
}