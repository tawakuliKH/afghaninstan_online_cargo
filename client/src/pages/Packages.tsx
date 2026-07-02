import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'
import { Search, MapPin, Package, Weight, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { getData } from 'country-list'

const countries = getData().sort((a, b) => a.name.localeCompare(b.name))

interface PackageItem {
  id: string
  title: string
  weight: number
  originCountry: string
  originCity: string
  destCountry: string
  destCity: string
  notes?: string
  goodsPhotoUrl?: string
  createdAt: string
  sender: {
    id: string
    nickname: string
    legalFullName?: string
    whatsappNumber?: string
    email?: string
  }
}

interface SearchForm {
  originCountry: string
  destCountry: string
}

function ContactInfo({ pkg, canSeeContact }: { pkg: PackageItem; canSeeContact: boolean }) {
  if (canSeeContact && (pkg.sender.whatsappNumber || pkg.sender.email)) {
    return (
      <div className="mt-3 space-y-1 border-t border-brand-muted/10 pt-3">
        {pkg.sender.whatsappNumber && (
          <p className="text-xs text-brand-muted">
            WhatsApp:{' '}
            <span className="font-medium text-brand-primary">{pkg.sender.whatsappNumber}</span>
          </p>
        )}
        {pkg.sender.email && (
          <p className="text-xs text-brand-muted">
            Email:{' '}
            <span className="font-medium text-brand-primary">{pkg.sender.email}</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 border-t border-brand-muted/10 pt-3">
      <p className="text-xs italic text-brand-muted">
        {!canSeeContact ? (
          <>
            <Link to="/register" className="text-brand-accent hover:underline">
              Create an account and post a trip or package
            </Link>{' '}
            to see contact details
          </>
        ) : (
          'Post a trip or package to see contact details'
        )}
      </p>
    </div>
  )
}

function PackageCard({
  pkg,
  viewerCanSeeContact,
}: {
  pkg: PackageItem
  viewerCanSeeContact: boolean
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Photo */}
      {pkg.goodsPhotoUrl && (
        <img
          src={pkg.goodsPhotoUrl}
          alt={pkg.title}
          className="mb-4 h-36 w-full rounded-lg object-cover"
        />
      )}

      {/* Title + weight */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 shrink-0 text-brand-accent" />
          <h3 className="font-semibold text-brand-primary">{pkg.title}</h3>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-brand-secondary/10 px-2 py-0.5 text-xs text-brand-secondary">
          <Weight className="h-3 w-3" />
          {pkg.weight} kg
        </span>
      </div>

      {/* Route */}
      <div className="mt-3 flex items-center gap-2">
        <div className="text-center">
          <p className="text-xs text-brand-muted">From</p>
          <p className="text-sm font-medium text-brand-primary">{pkg.originCity}</p>
          <p className="text-xs text-brand-muted">{pkg.originCountry}</p>
        </div>
        <div className="flex-1 border-t-2 border-dashed border-brand-secondary/40 mx-2" />
        <MapPin className="h-4 w-4 shrink-0 text-brand-accent" />
        <div className="text-center">
          <p className="text-xs text-brand-muted">To</p>
          <p className="text-sm font-medium text-brand-primary">{pkg.destCity}</p>
          <p className="text-xs text-brand-muted">{pkg.destCountry}</p>
        </div>
      </div>

      {pkg.notes && (
        <p className="mt-3 text-xs text-brand-muted">{pkg.notes}</p>
      )}

      {/* Sender */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-muted">Sender</p>
          <p className="text-sm font-medium text-brand-primary">
            {pkg.sender.legalFullName || pkg.sender.nickname}
          </p>
        </div>
        <p className="text-xs text-brand-muted">
          {new Date(pkg.createdAt).toLocaleDateString()}
        </p>
      </div>

      <ContactInfo pkg={pkg} canSeeContact={viewerCanSeeContact} />
    </div>
  )
}

function Packages() {
  const { user } = useAuthStore()
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [viewerCanSeeContact, setViewerCanSeeContact] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    originCountry: '',
    destCountry: '',
    startDate: '',
    endDate: '',
  })

  const { register, handleSubmit } = useForm<SearchForm>()

  const fetchPackages = async (filters = activeFilters, p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p) })
      if (filters.originCountry) params.set('originCountry', filters.originCountry)
      if (filters.destCountry) params.set('destCountry', filters.destCountry)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const res = await api.get(`/packages?${params.toString()}`)
      setPackages(res.data.packages)
      setTotalPages(res.data.pagination.totalPages)

      if (user?.accountStatus === 'APPROVED') {
        const myPackages = await api.get('/packages?page=1')
        const hasPosted = myPackages.data.packages.some(
          (p: PackageItem) => p.sender.id === user.id
        )
        setViewerCanSeeContact(hasPosted)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPackages() }, [page])

  const onSearch = (data: SearchForm) => {
    const filters = {
      originCountry: data.originCountry,
      destCountry: data.destCountry,
      startDate: startDate ? startDate.toISOString() : '',
      endDate: endDate ? endDate.toISOString() : '',
    }
    setActiveFilters(filters)
    setPage(1)
    fetchPackages(filters, 1)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Packages to Send</h1>
          <p className="text-sm text-brand-muted">
            Browse packages that need a traveler to carry them
          </p>
        </div>
        {user?.accountStatus === 'APPROVED' && (
          <Link
            to="/packages/new"
            className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Post a package
          </Link>
        )}
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSubmit(onSearch)}
        className="mb-8 rounded-xl bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              From country
            </label>
            <select
              {...register('originCountry')}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
            >
              <option value="">Any country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              To country
            </label>
            <select
              {...register('destCountry')}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
            >
              <option value="">Any country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              Posted from
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              placeholderText="Start date"
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              Posted to
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              placeholderText="End date"
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            Search packages
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : packages.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-brand-muted">No packages found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              viewerCanSeeContact={viewerCanSeeContact}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-brand-muted/30 p-2 text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-brand-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-brand-muted/30 p-2 text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default Packages