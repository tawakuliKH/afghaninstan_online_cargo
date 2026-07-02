import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getData } from 'country-list'
import api from '../lib/axios'
import toast from 'react-hot-toast'
import { Loader2, Upload, CheckCircle } from 'lucide-react'

const registerSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    legalFullName: z.string().min(2, 'Full name is required'),
    nickname: z.string().min(2, 'Nickname is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    whatsappNumber: z.string().min(5, 'WhatsApp number is required'),
    documentType: z.enum(['PASSPORT', 'TAZKIRA']),
    documentNumber: z.string().min(3, 'Document number is required'),
    documentIssuingCountry: z.string().optional(),
    permanentCountry: z.string().min(1, 'Required'),
    permanentCity: z.string().min(1, 'Required'),
    currentCountry: z.string().min(1, 'Required'),
    currentCity: z.string().min(1, 'Required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (d) => d.documentType !== 'PASSPORT' || !!d.documentIssuingCountry,
    { message: 'Issuing country is required for passports', path: ['documentIssuingCountry'] }
  )

type RegisterForm = z.infer<typeof registerSchema>

const countries = getData().sort((a, b) => a.name.localeCompare(b.name))

// Reusable field wrapper
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-primary">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-brand-danger">{error}</p>}
    </div>
  )
}

// Reusable text input
function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${className}`}
    />
  )
}

// Reusable select
function Select({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${className}`}
    />
  )
}

// File upload button
function FileField({ label, accept, onChange, fileName }: {
  label: string
  accept: string
  onChange: (file: File) => void
  fileName?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-primary">{label}</label>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-muted/40 bg-brand-bg px-4 py-3 transition hover:border-brand-primary">
        {fileName ? (
          <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
        ) : (
          <Upload className="h-5 w-5 shrink-0 text-brand-muted" />
        )}
        <span className="text-sm text-brand-muted">
          {fileName || 'Click to upload (JPEG, PNG, PDF — max 5MB)'}
        </span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]) }}
        />
      </label>
    </div>
  )
}

function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [visaFile, setVisaFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { documentType: 'PASSPORT' },
  })

  const documentType = watch('documentType')
  const currentCountry = watch('currentCountry')

  const onSubmit = async (data: RegisterForm) => {
    if (!passportFile) return toast.error('Passport/Tazkira photo is required')
    if (!faceFile) return toast.error('Face photo is required')

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== '') formData.append(key, String(val))
      })
      formData.append('passportPhoto', passportFile)
      formData.append('facePhoto', faceFile)
      if (visaFile) formData.append('visaResidencyDoc', visaFile)

      await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Registration submitted! Your account is pending admin approval.')
      navigate('/login')
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl bg-white p-8 shadow-lg">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-primary">Create your account</h1>
          <p className="mt-1 text-sm text-brand-muted">
            All information must match your identity document exactly.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Section: Account */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Account Details
            </h2>
            <div className="space-y-4">
              <Field label="Email address" error={errors.email?.message}>
                <Input {...register('email')} type="email" placeholder="you@example.com" />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Password" error={errors.password?.message}>
                  <Input {...register('password')} type="password" placeholder="Min. 8 characters" />
                </Field>
                <Field label="Confirm password" error={errors.confirmPassword?.message}>
                  <Input {...register('confirmPassword')} type="password" placeholder="Repeat password" />
                </Field>
              </div>
            </div>
          </div>

          {/* Section: Personal */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Personal Information
            </h2>
            <div className="space-y-4">
              <Field label="Legal full name (as on your document)" error={errors.legalFullName?.message}>
                <Input {...register('legalFullName')} placeholder="Exactly as on your ID" />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nickname (shown publicly)" error={errors.nickname?.message}>
                  <Input {...register('nickname')} placeholder="Your public name" />
                </Field>
                <Field label="Date of birth" error={errors.dateOfBirth?.message}>
                  <Input {...register('dateOfBirth')} type="date" />
                </Field>
              </div>
              <Field label="WhatsApp number" error={errors.whatsappNumber?.message}>
                <Input {...register('whatsappNumber')} placeholder="+1 234 567 8900" />
              </Field>
            </div>
          </div>

          {/* Section: Identity document */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Identity Document
            </h2>
            <div className="space-y-4">
              <Field label="Document type" error={errors.documentType?.message}>
                <Select {...register('documentType')}>
                  <option value="PASSPORT">Passport</option>
                  <option value="TAZKIRA">Afghan Tazkira (National ID)</option>
                </Select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Document number" error={errors.documentNumber?.message}>
                  <Input {...register('documentNumber')} placeholder="e.g. AB1234567" />
                </Field>
                {documentType === 'PASSPORT' && (
                  <Field label="Issuing country" error={errors.documentIssuingCountry?.message}>
                    <Select {...register('documentIssuingCountry')}>
                      <option value="">Select country</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
            </div>
          </div>

          {/* Section: Residence */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Residence
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Permanent country" error={errors.permanentCountry?.message}>
                  <Select {...register('permanentCountry')}>
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Permanent city" error={errors.permanentCity?.message}>
                  <Input {...register('permanentCity')} placeholder="City" />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Current country" error={errors.currentCountry?.message}>
                  <Select {...register('currentCountry')}>
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Current city" error={errors.currentCity?.message}>
                  <Input {...register('currentCity')} placeholder="City" />
                </Field>
              </div>
            </div>
          </div>

          {/* Section: Documents upload */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Document Uploads
            </h2>
            <div className="space-y-4">
              <FileField
                label={documentType === 'TAZKIRA' ? 'Tazkira photo (first page) *' : 'Passport photo (first page) *'}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={setPassportFile}
                fileName={passportFile?.name}
              />
              <FileField
                label="Your face photo *"
                accept="image/jpeg,image/png,image/webp"
                onChange={setFaceFile}
                fileName={faceFile?.name}
              />
              {currentCountry && currentCountry !== 'Afghanistan' && (
                <FileField
                  label="Visa or residency permit in current country"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={setVisaFile}
                  fileName={visaFile?.name}
                />
              )}
              <p className="text-xs text-brand-muted">
                * Documents are stored securely and only visible to administrators.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit registration
          </button>

          <p className="text-center text-sm text-brand-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register