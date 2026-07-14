import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { SEO } from "../components/SEO";
import { getData } from "country-list";
import { useAuthStore } from "../store/authStore";

const countries = getData().sort((a, b) => a.name.localeCompare(b.name));

const packageSchema = z.object({
  title: z.string().min(2, "Title is required"),
  weight: z.coerce.number().positive("Weight must be positive"),
  originCountry: z.string().min(1, "Required"),
  originCity: z.string().min(1, "Required"),
  destCountry: z.string().min(1, "Required"),
  destCity: z.string().min(1, "Required"),
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientWhatsapp: z.string().min(5, "Required"),
  recipientEmail: z.string().email("Invalid email"),
  notes: z.string().optional(),
});

type PackageForm = z.infer<typeof packageSchema>;

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

function NewPackage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isNotApproved = user?.accountStatus !== "APPROVED";
  const hasUnpaidCommission = Boolean(user?.hasUnpaidCommission);
  const [goodsPhoto, setGoodsPhoto] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PackageForm>({
    resolver: zodResolver(packageSchema) as any,
  });

  const onSubmit = async (data: PackageForm) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== "") formData.append(key, String(val));
      });
      if (goodsPhoto) formData.append("goodsPhoto", goodsPhoto);

      await api.post("/packages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Package posted successfully!");
      navigate("/packages");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to post package");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <SEO
        titleEn="Post a Package"
        titleFa="ثبت یک بسته"
        descriptionEn="Post your package so travelers heading your way can find you and propose a delivery."
        descriptionFa="بسته خود را ثبت کنید تا مسافرانی که به سمت شما می‌روند بتوانند شما را پیدا کرده و تحویل را پیشنهاد دهند."
        path="/packages/new"
        noIndex
      />
      <Link
        to="/packages"
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to packages
      </Link>

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-brand-primary">
          Post a Package
        </h1>

        {isNotApproved && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
            Your account is awaiting admin approval. You cannot post yet. You'll be
            notified by email as soon as your account is approved.
          </div>
        )}

        {!isNotApproved && hasUnpaidCommission && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/5 px-4 py-3 text-sm text-brand-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            You have unpaid commission. Please settle it before posting new packages.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Package details */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Package Details
            </h2>
            <div className="space-y-4">
              <Field
                label="Package title / description"
                required
                error={errors.title?.message}
              >
                <Input
                  {...register("title")}
                  placeholder="e.g. Box of clothes"
                />
              </Field>
              <Field label="Weight (kg)" required error={errors.weight?.message}>
                <Input
                  {...register("weight")}
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.5"
                />
              </Field>

              {/* Goods photo */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                  Photo of goods — optional
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-muted/40 bg-brand-bg px-4 py-3 transition hover:border-brand-primary">
                  {goodsPhoto ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                  ) : (
                    <Upload className="h-5 w-5 shrink-0 text-brand-muted" />
                  )}
                  <span className="text-sm text-brand-muted">
                    {goodsPhoto?.name ||
                      "Click to upload (JPEG, PNG — max 5MB)"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setGoodsPhoto(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Route */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Route
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="From country" required error={errors.originCountry?.message}>
                <Select {...register("originCountry")}>
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="From city" required error={errors.originCity?.message}>
                <Input {...register("originCity")} placeholder="City" />
              </Field>
              <Field label="To country" required error={errors.destCountry?.message}>
                <Select {...register("destCountry")}>
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="To city" required error={errors.destCity?.message}>
                <Input {...register("destCity")} placeholder="City" />
              </Field>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Recipient Details
            </h2>
            <div className="space-y-4">
              <Field
                label="Recipient full name"
                required
                error={errors.recipientName?.message}
              >
                <Input
                  {...register("recipientName")}
                  placeholder="Person who will receive the package"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Recipient WhatsApp"
                  required
                  error={errors.recipientWhatsapp?.message}
                >
                  <Input
                    {...register("recipientWhatsapp")}
                    placeholder="+1 234 567 8900"
                  />
                </Field>
                <Field
                  label="Recipient email"
                  required
                  error={errors.recipientEmail?.message}
                >
                  <Input
                    {...register("recipientEmail")}
                    type="email"
                    placeholder="recipient@example.com"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Notes */}
          <Field
            label="Additional notes — optional"
            error={errors.notes?.message}
          >
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Fragile? Special handling? Any other details..."
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting || hasUnpaidCommission || isNotApproved}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Post package
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewPackage;
