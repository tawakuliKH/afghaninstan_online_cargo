import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, Package, MapPin, Weight } from 'lucide-react'
import { AgreementModal } from '../components/AgreementModal'

interface PackageData {
  id: string
  title: string
  weight: number
  originCity: string
  originCountry: string
  destCity: string
  destCountry: string
  notes?: string
  goodsPhotoUrl?: string
}

interface Traveler {
  id: string
  nickname: string
  legalFullName?: string
  rating: number
  packagesDeliveredCount: number
}

const proposeSchema = z.object({
  travelerId: z.string().min(1, 'Please select a traveler'),
  agreedAmount: z.coerce.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AFN', 'AED', 'TRY', 'CAD', 'AUD']),
  paymentLocation: z.enum(['ORIGIN', 'DESTINATION']),
})

type ProposeForm = z.infer<typeof proposeSchema>

function ProposeDelivery() {
  const { packageId } = useParams<{ packageId: string }>()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState<PackageData | null>(null)
  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [loading, setLoading] = useState(true)
  const [showAgreement, setShowAgreement] = useState(false)
  const [pendingData, setPendingData] = useState<ProposeForm | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProposeForm>({
    resolver: zodResolver(proposeSchema) as any,
    defaultValues: { currency: 'USD', paymentLocation: 'ORIGIN' },
  })

  const selectedTravelerId = watch('travelerId')
  const selectedTraveler = travelers.find((t) => t.id === selectedTravelerId)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pkgRes, usersRes] = await Promise.all([
          api.get(`/packages/${packageId}`),
          api.get('/auth/users'),
        ])
        setPkg(pkgRes.data.package)

        // Filter out current user from travelers list
        const allUsers = usersRes.data.users
        setTravelers(allUsers)
      } catch {
        toast.error('Failed to load data')
        navigate('/profile')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [packageId])

  const onSubmit = async (data: ProposeForm) => {
    setPendingData(data)
    setShowAgreement(true)
  }

  const handleAgreementAccepted = async () => {
    if (!pendingData) return
    setShowAgreement(false)
    try {
      await api.post('/deliveries/propose', {
        packageId,
        travelerId: pendingData.travelerId,
        agreedAmount: pendingData.agreedAmount,
        currency: pendingData.currency,
        paymentLocation: pendingData.paymentLocation,
      })
      toast.success('Delivery request sent to traveler!')
      navigate('/profile?tab=deliveries')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to propose delivery')
    }
  }

  if (loading) return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  )

  if (!pkg) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to="/profile?tab=packages"
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my packages
      </Link>

      {/* Package summary */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
          Package to Deliver
        </h2>
        <div className="flex gap-4">
          {pkg.goodsPhotoUrl ? (
            <img
              src={pkg.goodsPhotoUrl}
              alt={pkg.title}
              className="h-24 w-24 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-brand-primary/5 border border-brand-muted/10">
              <Package className="h-8 w-8 text-brand-primary/30" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-bold text-brand-primary">{pkg.title}</h3>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-muted">
              <span className="flex items-center gap-1">
                <Weight className="h-3 w-3" /> {pkg.weight} kg
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {pkg.originCity}, {pkg.originCountry}
                {' → '}
                {pkg.destCity}, {pkg.destCountry}
              </span>
            </div>
            {pkg.notes && (
              <p className="mt-2 text-xs text-brand-muted">{pkg.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Propose form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-brand-primary">
          Propose Delivery
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Traveler selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-primary">
              Select Traveler
            </label>
            <select
              {...register('travelerId')}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">Choose a traveler...</option>
              {travelers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nickname}
                  {t.legalFullName ? ` (${t.legalFullName})` : ''}
                  {t.packagesDeliveredCount > 0 ? ` — ${t.packagesDeliveredCount} delivered` : ''}
                  {t.rating > 0 ? ` ⭐ ${t.rating.toFixed(1)}` : ''}
                </option>
              ))}
            </select>
            {errors.travelerId && (
              <p className="mt-1 text-xs text-brand-danger">{errors.travelerId.message}</p>
            )}
          </div>

          {/* Selected traveler preview */}
          {selectedTraveler && (
            <div className="rounded-xl border border-brand-secondary/20 bg-brand-secondary/5 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/9.x/personas/svg?seed=${selectedTraveler.id}&backgroundColor=e8edf5`}
                  alt={selectedTraveler.nickname}
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-brand-primary">{selectedTraveler.nickname}</p>
                  {selectedTraveler.legalFullName && (
                    <p className="text-xs text-brand-muted">{selectedTraveler.legalFullName}</p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs text-brand-muted">
                    <span>⭐ {selectedTraveler.rating > 0 ? selectedTraveler.rating.toFixed(1) : 'No ratings'}</span>
                    <span>{selectedTraveler.packagesDeliveredCount} packages delivered</span>
                  </div>
                </div>
                <Link
                  to={`/users/${selectedTraveler.id}`}
                  target="_blank"
                  className="ml-auto text-xs text-brand-accent hover:underline"
                >
                  View profile →
                </Link>
              </div>
            </div>
          )}

          {/* Agreed amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                Agreed amount
              </label>
              <input
                {...register('agreedAmount')}
                type="number"
                step="0.01"
                placeholder="e.g. 50"
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              {errors.agreedAmount && (
                <p className="mt-1 text-xs text-brand-danger">{errors.agreedAmount.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                Currency
              </label>
              <select
                {...register('currency')}
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              >
                {['USD', 'EUR', 'GBP', 'AFN', 'AED', 'TRY', 'CAD', 'AUD'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment location */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-primary">
              Payment location
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['ORIGIN', 'DESTINATION'] as const).map((loc) => (
                <label
                  key={loc}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-3 transition has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary/5"
                >
                  <input
                    type="radio"
                    value={loc}
                    {...register('paymentLocation')}
                    className="accent-brand-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-brand-primary">
                      {loc === 'ORIGIN' ? 'At origin' : 'At destination'}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {loc === 'ORIGIN' ? 'Pay when handing over' : 'Pay on delivery'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4">
            <p className="text-xs text-brand-muted">
              <span className="font-semibold text-brand-accent">Important:</span> By proceeding, you confirm that you have physically met the traveler, verified their identity document, and handed over the package. You will be required to read and agree to the Sender Terms before this request is submitted.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue to Agreement
          </button>
        </form>
      </div>

      {/* Agreement modal */}
      {showAgreement && packageId && (
        <AgreementModal
          isOpen={showAgreement}
          onClose={() => setShowAgreement(false)}
          onAccepted={handleAgreementAccepted}
          type="DELIVER_PACKAGE"
          deliveryId={packageId}
          role="sender"
        />
      )}
    </div>
  )
}

export default ProposeDelivery