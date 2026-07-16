import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.success(t("newPackage.toastSuccess"));
      navigate("/packages");
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("newPackage.toastFailed"));
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
        <ArrowLeft className="h-4 w-4" /> {t("newPackage.backToPackages")}
      </Link>

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-brand-primary">
          {t("newPackage.pageTitle")}
        </h1>

        {isNotApproved && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
            {t("newPackage.notApprovedBanner")}
          </div>
        )}

        {!isNotApproved && hasUnpaidCommission && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/5 px-4 py-3 text-sm text-brand-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t("newPackage.unpaidCommissionBanner")}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Package details */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              {t("newPackage.packageDetailsHeading")}
            </h2>
            <div className="space-y-4">
              <Field
                label={t("newPackage.titleLabel")}
                required
                error={errors.title?.message}
              >
                <Input
                  {...register("title")}
                  placeholder={t("newPackage.titlePlaceholder")}
                />
              </Field>
              <Field label={t("newPackage.weightLabel")} required error={errors.weight?.message}>
                <Input
                  {...register("weight")}
                  type="number"
                  step="0.1"
                  placeholder={t("newPackage.weightPlaceholder")}
                />
              </Field>

              {/* Goods photo */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                  {t("newPackage.photoLabel")}
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-muted/40 bg-brand-bg px-4 py-3 transition hover:border-brand-primary">
                  {goodsPhoto ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                  ) : (
                    <Upload className="h-5 w-5 shrink-0 text-brand-muted" />
                  )}
                  <span className="text-sm text-brand-muted">
                    {goodsPhoto?.name || t("newPackage.photoHint")}
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
              {t("newPackage.routeHeading")}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("newPackage.fromCountry")} required error={errors.originCountry?.message}>
                <Select {...register("originCountry")}>
                  <option value="">{t("newPackage.selectCountry")}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("newPackage.fromCity")} required error={errors.originCity?.message}>
                <Input {...register("originCity")} placeholder={t("newPackage.cityPlaceholder")} />
              </Field>
              <Field label={t("newPackage.toCountry")} required error={errors.destCountry?.message}>
                <Select {...register("destCountry")}>
                  <option value="">{t("newPackage.selectCountry")}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("newPackage.toCity")} required error={errors.destCity?.message}>
                <Input {...register("destCity")} placeholder={t("newPackage.cityPlaceholder")} />
              </Field>
            </div>
          </div>

          {/* Recipient */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              {t("newPackage.recipientHeading")}
            </h2>
            <div className="space-y-4">
              <Field
                label={t("newPackage.recipientNameLabel")}
                required
                error={errors.recipientName?.message}
              >
                <Input
                  {...register("recipientName")}
                  placeholder={t("newPackage.recipientNamePlaceholder")}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={t("newPackage.recipientWhatsappLabel")}
                  required
                  error={errors.recipientWhatsapp?.message}
                >
                  <Input
                    {...register("recipientWhatsapp")}
                    placeholder="+1 234 567 8900"
                  />
                </Field>
                <Field
                  label={t("newPackage.recipientEmailLabel")}
                  required
                  error={errors.recipientEmail?.message}
                >
                  <Input
                    {...register("recipientEmail")}
                    type="email"
                    placeholder={t("newPackage.recipientEmailPlaceholder")}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Notes */}
          <Field
            label={t("newPackage.notesLabel")}
            error={errors.notes?.message}
          >
            <textarea
              {...register("notes")}
              rows={3}
              placeholder={t("newPackage.notesPlaceholder")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting || hasUnpaidCommission || isNotApproved}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("newPackage.submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewPackage;
