import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { getData } from "country-list";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { SEO } from "../components/SEO";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email"),
    confirmEmail: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    legalFullName: z.string().min(2, "Full name is required"),
    nickname: z.string().min(2, "Nickname is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    whatsappNumber: z.string().min(5, "WhatsApp number is required"),
    documentType: z.enum(["PASSPORT", "TAZKIRA"]),
    documentNumber: z.string().min(3, "Document number is required"),
    documentIssuingCountry: z.string().optional(),
    permanentCountry: z.string().min(1, "Required"),
    permanentCity: z.string().min(1, "Required"),
    currentCountry: z.string().min(1, "Required"),
    currentCity: z.string().min(1, "Required"),
  })
  .refine((d) => d.email === d.confirmEmail, {
    message: "Email addresses do not match",
    path: ["confirmEmail"],
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.documentType !== "PASSPORT" || !!d.documentIssuingCountry, {
    message: "Issuing country is required for passports",
    path: ["documentIssuingCountry"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const countries = getData().sort((a, b) => a.name.localeCompare(b.name));

// ── Structured Data ─────────────────────────────────────────

const REGISTER_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Create Account — Afghanistan Online Cargo",
  "alternateName": "ثبت‌نام — کارگو آنلاین افغانستان",
  "description": "Register on Afghanistan Online Cargo with your verified identity documents. Join thousands of Afghan senders and travelers for safe cross-border package coordination.",
  "url": "https://afghancargo.online/register",
  "inLanguage": ["en", "fa"],
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://afghancargo.online" },
      { "@type": "ListItem", "position": 2, "name": "Register", "item": "https://afghancargo.online/register" }
    ]
  }
}

// ── Reusable components ──────────────────────────────────────

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-primary">
        {label}
        {required && <span className="text-brand-danger"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-brand-danger">{error}</p>}
    </div>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${className}`}
    />
  );
}

function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${className}`}
    />
  );
}

function FileField({
  label,
  accept,
  onChange,
  fileName,
  required,
  error,
}: {
  label: string;
  accept: string;
  onChange: (file: File) => void;
  fileName?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-primary">
        {label}
        {required && <span className="text-brand-danger"> *</span>}
      </label>
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed bg-brand-bg px-4 py-3 transition hover:border-brand-primary ${
          error ? "border-brand-danger" : "border-brand-muted/40"
        }`}
      >
        {fileName ? (
          <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
        ) : (
          <Upload className="h-5 w-5 shrink-0 text-brand-muted" />
        )}
        <span className="text-sm text-brand-muted">
          {fileName || "Click to upload (JPEG, PNG, PDF — max 5MB)"}
        </span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onChange(e.target.files[0]);
          }}
        />
      </label>
      {error && <p className="mt-1 text-xs text-brand-danger">{error}</p>}
    </div>
  );
}

// ── Main Register page ───────────────────────────────────────

function Register() {
  useTranslation();
  const navigate = useNavigate();
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [visaFile, setVisaFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<{
    passport?: string;
    face?: string;
    visa?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: { documentType: "PASSPORT" },
  });

  const documentType = watch("documentType");
  const currentCountry = watch("currentCountry");
  const visaRequired =
    Boolean(currentCountry) && currentCountry !== "Afghanistan";

  const onSubmit = async (data: RegisterForm) => {
    const newFileErrors: {
      passport?: string;
      face?: string;
      visa?: string;
    } = {};
    if (!passportFile)
      newFileErrors.passport =
        documentType === "TAZKIRA"
          ? "Tazkira photo is required"
          : "Passport photo is required";
    if (!faceFile) newFileErrors.face = "Face photo is required";
    if (visaRequired && !visaFile)
      newFileErrors.visa =
        "Visa or residency document is required for non-Afghan residents";

    setFileErrors(newFileErrors);
    if (Object.keys(newFileErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key === "confirmEmail") return;
        if (val !== undefined && val !== "") formData.append(key, String(val));
      });
      if (passportFile) formData.append("passportPhoto", passportFile);
      if (faceFile) formData.append("facePhoto", faceFile);
      if (visaFile) formData.append("visaResidencyDoc", visaFile);

      await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(
        "Registration submitted! Your account is pending admin approval."
      );
      navigate("/login");
    } catch (err: any) {
      const msg =
        err.response?.data?.error || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <SEO
        titleEn="Join Afghanistan Online Cargo — Create Your Verified Account"
        titleFa="به کارگو آنلاین افغانستان بپیوندید — حساب تأیید شده خود را بسازید"
        descriptionEn="Register on Afghanistan Online Cargo with your passport or Tazkira. Join verified Afghan senders and travelers for safe, KYC-verified cross-border package coordination. Free to join."
        descriptionFa="در کارگو آنلاین افغانستان با پاسپورت یا تذکره خود ثبت‌نام کنید. به فرستندگان و مسافران افغانی تأیید شده برای هماهنگی امن بسته‌های بین‌المللی بپیوندید. ثبت‌نام رایگان است."
        keywordsEn="register Afghanistan cargo, join Afghan delivery, create account Afghan cargo, Afghan traveler register, Afghan sender register, KYC verification Afghanistan, join Afghan package platform, ثبت نام کارگو افغانستان"
        keywordsFa="ثبت نام کارگو افغانستان، پیوستن به تحویل افغانی، ساختن حساب کارگو افغانی، ثبت نام مسافر افغانی، ثبت نام فرستنده افغانی، تأیید هویت افغانستان، پیوستن به پلتفرم بسته افغانی"
        path="/register"
        noIndex={false}
        structuredData={REGISTER_STRUCTURED_DATA}
      />

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-primary">
            Create your account
          </h1>
          <p className="mt-0.5 text-xs font-medium text-brand-accent">
            حساب خود را بسازید
          </p>
          <p className="mt-2 text-sm text-brand-muted">
            All information must match your identity document exactly.
          </p>
          <p className="mt-0.5 text-xs text-brand-muted/70">
            تمام اطلاعات باید دقیقاً با سند هویتی شما مطابقت داشته باشد.
          </p>

          {/* Trust indicators */}
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              🔒 Free to join
            </span>
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              🛡️ KYC Verified
            </span>
            <span className="flex items-center gap-1 rounded-full bg-brand-primary/5 px-3 py-1 text-xs font-medium text-brand-primary">
              ✅ Admin reviewed
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Account */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Account Details
            </h2>
            <div className="space-y-4">
              <Field
                label="Email address"
                required
                error={errors.email?.message}
              >
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>
              <Field
                label="Confirm email address"
                required
                error={errors.confirmEmail?.message}
              >
                <Input
                  {...register("confirmEmail")}
                  type="email"
                  placeholder="Re-enter your email"
                  autoComplete="email"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Password"
                  required
                  error={errors.password?.message}
                >
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                </Field>
                <Field
                  label="Confirm password"
                  required
                  error={errors.confirmPassword?.message}
                >
                  <Input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
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
              <Field
                label="Legal full name (as on your document)"
                required
                error={errors.legalFullName?.message}
              >
                <Input
                  {...register("legalFullName")}
                  placeholder="Exactly as on your ID"
                  autoComplete="name"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Nickname (shown publicly)"
                  required
                  error={errors.nickname?.message}
                >
                  <Input
                    {...register("nickname")}
                    placeholder="Your public name"
                    autoComplete="username"
                  />
                </Field>
                <Field
                  label="Date of birth"
                  required
                  error={errors.dateOfBirth?.message}
                >
                  <Input
                    {...register("dateOfBirth")}
                    type="date"
                    autoComplete="bday"
                  />
                </Field>
              </div>
              <Field
                label="WhatsApp number"
                required
                error={errors.whatsappNumber?.message}
              >
                <Input
                  {...register("whatsappNumber")}
                  placeholder="+1 234 567 8900"
                  autoComplete="tel"
                />
              </Field>
            </div>
          </div>

          {/* Section: Identity document */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Identity Document
            </h2>
            <div className="space-y-4">
              <Field
                label="Document type"
                required
                error={errors.documentType?.message}
              >
                <Select {...register("documentType")}>
                  <option value="PASSPORT">Passport — پاسپورت</option>
                  <option value="TAZKIRA">
                    Afghan Tazkira (National ID) — تذکره افغانی
                  </option>
                </Select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Document number"
                  required
                  error={errors.documentNumber?.message}
                >
                  <Input
                    {...register("documentNumber")}
                    placeholder="e.g. AB1234567"
                  />
                </Field>
                {documentType === "PASSPORT" && (
                  <Field
                    label="Issuing country"
                    required
                    error={errors.documentIssuingCountry?.message}
                  >
                    <Select {...register("documentIssuingCountry")}>
                      <option value="">Select country</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
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
              Residence — محل اقامت
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Permanent country"
                  required
                  error={errors.permanentCountry?.message}
                >
                  <Select {...register("permanentCountry")}>
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Permanent city"
                  required
                  error={errors.permanentCity?.message}
                >
                  <Input
                    {...register("permanentCity")}
                    placeholder="City"
                    autoComplete="address-level2"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Current country"
                  required
                  error={errors.currentCountry?.message}
                >
                  <Select {...register("currentCountry")}>
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Current city"
                  required
                  error={errors.currentCity?.message}
                >
                  <Input
                    {...register("currentCity")}
                    placeholder="City"
                    autoComplete="address-level2"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Section: Documents upload */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Document Uploads — بارگذاری اسناد
            </h2>
            <div className="space-y-4">
              <FileField
                label={
                  documentType === "TAZKIRA"
                    ? "Tazkira photo (first page) — عکس تذکره (صفحه اول)"
                    : "Passport photo (first page) — عکس پاسپورت (صفحه اول)"
                }
                required
                error={fileErrors.passport}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(file) => {
                  setPassportFile(file);
                  setFileErrors((prev) => ({ ...prev, passport: undefined }));
                }}
                fileName={passportFile?.name}
              />

              <FileField
                label="Your face photo — عکس چهره شما"
                required
                error={fileErrors.face}
                accept="image/jpeg,image/png,image/webp"
                onChange={(file) => {
                  setFaceFile(file);
                  setFileErrors((prev) => ({ ...prev, face: undefined }));
                }}
                fileName={faceFile?.name}
              />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>📸 Photo requirements:</strong> Your face must be
                  clearly visible, well-lit, and directly comparable to your
                  identity document photo. Blurry, masked, or obscured photos
                  will result in rejection.
                </p>
                <p className="mt-1 text-xs text-amber-600/80 leading-relaxed">
                  چهره شما باید به وضوح قابل مشاهده، با نور کافی و مستقیماً
                  قابل مقایسه با عکس سند هویتی شما باشد. عکس‌های تاریک، با
                  ماسک یا مبهم منجر به رد شدن درخواست می‌شوند.
                </p>
              </div>

              {visaRequired && (
                <FileField
                  label="Visa or residency permit — ویزا یا اجازه اقامت"
                  required
                  error={fileErrors.visa}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(file) => {
                    setVisaFile(file);
                    setFileErrors((prev) => ({ ...prev, visa: undefined }));
                  }}
                  fileName={visaFile?.name}
                />
              )}

              <div className="rounded-lg border border-brand-secondary/20 bg-brand-secondary/5 p-3">
                <p className="text-xs text-brand-muted leading-relaxed">
                  🔒 <strong>Your documents are safe.</strong> All uploaded
                  files are stored in private encrypted storage and are only
                  accessible to platform administrators for identity
                  verification. They are never shared with other users.
                </p>
                <p className="mt-1 text-xs text-brand-muted/70 leading-relaxed">
                  تمام فایل‌های آپلود شده در حافظه خصوصی رمزگذاری شده ذخیره
                  می‌شوند و فقط برای مدیران پلتفرم برای تأیید هویت قابل دسترسی
                  هستند. آن‌ها هرگز با سایر کاربران به اشتراک گذاشته نمی‌شوند.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit registration — ثبت‌نام
          </button>

          <p className="text-center text-sm text-brand-muted">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-brand-accent hover:underline"
            >
              Sign in — ورود
            </Link>
          </p>

          {/* Bottom SEO trust text */}
          <div className="border-t border-brand-muted/10 pt-4 text-center">
            <p className="text-xs text-brand-muted/60 leading-relaxed">
              Afghanistan Online Cargo is free to join. Accounts are manually
              reviewed within 1-2 business days. You'll receive an email
              notification when your account is approved.
            </p>
            <p className="mt-1 text-xs text-brand-muted/50 leading-relaxed">
              پیوستن به کارگو آنلاین افغانستان رایگان است. حساب‌ها ظرف ۱-۲
              روز کاری به صورت دستی بررسی می‌شوند. پس از تأیید حساب، یک
              اعلان ایمیل دریافت خواهید کرد.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;