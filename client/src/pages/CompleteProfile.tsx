import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getData } from "country-list";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { Loader2, Upload, CheckCircle, CheckCircle2 } from "lucide-react";
import { SEO } from "../components/SEO";

interface CompleteProfileForm {
  documentType: "PASSPORT" | "TAZKIRA";
  documentNumber: string;
  documentIssuingCountry?: string;
  dateOfBirth: string;
  permanentCountry: string;
  permanentCity: string;
  currentCountry: string;
  currentCity: string;
}

const countries = getData().sort((a, b) => a.name.localeCompare(b.name));

// ── Reusable form components (mirrors Register.tsx patterns) ──

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
  hint,
}: {
  label: string;
  accept: string;
  onChange: (file: File) => void;
  fileName?: string;
  required?: boolean;
  error?: string;
  hint: string;
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
        <span className="text-sm text-brand-muted">{fileName || hint}</span>
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

function ProgressSteps({ current }: { current: 1 | 2 | 3 }) {
  const { t } = useTranslation();
  const steps = [
    { n: 1, label: t("completeProfile.progressAccount") },
    { n: 2, label: t("completeProfile.progressProfile") },
    { n: 3, label: t("completeProfile.progressApproved") },
  ];
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                s.n < current
                  ? "bg-green-500 text-white"
                  : s.n === current
                  ? "animate-pulse bg-brand-accent text-white"
                  : "bg-brand-muted/10 text-brand-muted"
              }`}
            >
              {s.n < current ? <CheckCircle2 className="h-4 w-4" /> : s.n}
            </div>
            <span className="text-[10px] text-brand-muted">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="mb-4 h-px w-8 bg-brand-muted/20" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────

function CompleteProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [visaFile, setVisaFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<{
    passport?: string;
    face?: string;
    visa?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Zod validation messages must be reactive to the active language, so the
  // schema is rebuilt whenever it changes rather than defined at module scope.
  const completeProfileSchema = useMemo(
    () =>
      z
        .object({
          documentType: z.enum(["PASSPORT", "TAZKIRA"]),
          documentNumber: z.string().min(3, t("completeProfile.documentNumberRequired")),
          documentIssuingCountry: z.string().optional(),
          dateOfBirth: z.string().min(1, t("completeProfile.dateOfBirthRequired")),
          permanentCountry: z.string().min(1, t("completeProfile.requiredField")),
          permanentCity: z.string().min(1, t("completeProfile.requiredField")),
          currentCountry: z.string().min(1, t("completeProfile.requiredField")),
          currentCity: z.string().min(1, t("completeProfile.requiredField")),
        })
        .refine((d) => d.documentType !== "PASSPORT" || !!d.documentIssuingCountry, {
          message: t("completeProfile.issuingCountryRequired"),
          path: ["documentIssuingCountry"],
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompleteProfileForm>({
    resolver: zodResolver(completeProfileSchema) as any,
    defaultValues: { documentType: "PASSPORT" },
  });

  const documentType = watch("documentType");
  const currentCountry = watch("currentCountry");
  const visaRequired =
    Boolean(currentCountry) && currentCountry !== "Afghanistan";

  if (!user) return null;

  const onSubmit = async (data: CompleteProfileForm) => {
    const newFileErrors: { passport?: string; face?: string; visa?: string } = {};
    if (!passportFile)
      newFileErrors.passport =
        documentType === "TAZKIRA"
          ? t("completeProfile.fileErrorTazkiraRequired")
          : t("completeProfile.fileErrorPassportRequired");
    if (!faceFile) newFileErrors.face = t("completeProfile.fileErrorFaceRequired");
    if (visaRequired && !visaFile)
      newFileErrors.visa = t("completeProfile.fileErrorVisaRequired");

    setFileErrors(newFileErrors);
    if (Object.keys(newFileErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== "") formData.append(key, String(val));
      });
      if (passportFile) formData.append("passportPhoto", passportFile);
      if (faceFile) formData.append("facePhoto", faceFile);
      if (visaFile) formData.append("visaResidencyDoc", visaFile);

      const res = await api.post("/auth/complete-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      updateUser({ profileCompleted: res.data.user.profileCompleted });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || t("completeProfile.toastSubmitFailed");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already submitted previously (came back to this route directly)
  if (user.profileCompleted && !submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <SEO
          titleEn="Profile Under Review"
          titleFa="پروفایل در حال بررسی"
          descriptionEn="Your profile has been submitted and is under admin review."
          descriptionFa="پروفایل شما ارسال شده و در حال بررسی ادمین است."
          path="/profile/complete"
          noIndex
        />
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-brand-primary">
          {t("completeProfile.alreadySubmittedTitle")}
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          {t("completeProfile.alreadySubmittedBody")}
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {t("completeProfile.goHome")}
        </button>
      </div>
    );
  }

  // Success state after this submission
  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-20 w-20 animate-bounce text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-brand-primary">
          {t("completeProfile.successTitle")}
        </h1>
        <p className="mt-4 text-sm text-brand-muted">
          {t("completeProfile.successBody")}
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {t("completeProfile.goHomeArrow")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <SEO
        titleEn="Complete Your Profile"
        titleFa="پروفایل خود را تکمیل کنید"
        descriptionEn="Upload your identity documents to complete KYC verification and get approved on Afghanistan Online Cargo."
        descriptionFa="اسناد هویتی خود را برای تکمیل تأیید هویت و تأیید حساب آپلود کنید."
        path="/profile/complete"
        noIndex
      />

      <ProgressSteps current={2} />

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-primary">
            {t("completeProfile.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            {t("completeProfile.pageSubtitle")}
          </p>

          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-left">
            <p className="text-xs text-blue-700">{t("completeProfile.kycInfoBanner")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Identity Document */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              {t("completeProfile.identityDocHeading")}
            </h2>
            <div className="space-y-4">
              <Field
                label={t("completeProfile.documentTypeLabel")}
                required
                error={errors.documentType?.message}
              >
                <Select {...register("documentType")}>
                  <option value="PASSPORT">{t("completeProfile.documentTypePassport")}</option>
                  <option value="TAZKIRA">{t("completeProfile.documentTypeTazkira")}</option>
                </Select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={t("completeProfile.documentNumberLabel")}
                  required
                  error={errors.documentNumber?.message}
                >
                  <Input
                    {...register("documentNumber")}
                    placeholder={t("completeProfile.documentNumberPlaceholder")}
                  />
                </Field>
                {documentType === "PASSPORT" && (
                  <Field
                    label={t("completeProfile.issuingCountryLabel")}
                    required
                    error={errors.documentIssuingCountry?.message}
                  >
                    <Select {...register("documentIssuingCountry")}>
                      <option value="">{t("completeProfile.selectCountry")}</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
              <Field
                label={t("completeProfile.dateOfBirthLabel")}
                required
                error={errors.dateOfBirth?.message}
              >
                <Input {...register("dateOfBirth")} type="date" autoComplete="bday" />
              </Field>
            </div>
          </div>

          {/* Section 2: Residence */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              {t("completeProfile.residenceHeading")}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={t("completeProfile.permanentCountryLabel")}
                  required
                  error={errors.permanentCountry?.message}
                >
                  <Select {...register("permanentCountry")}>
                    <option value="">{t("completeProfile.selectCountry")}</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label={t("completeProfile.permanentCityLabel")}
                  required
                  error={errors.permanentCity?.message}
                >
                  <Input
                    {...register("permanentCity")}
                    placeholder={t("completeProfile.cityPlaceholder")}
                    autoComplete="address-level2"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={t("completeProfile.currentCountryLabel")}
                  required
                  error={errors.currentCountry?.message}
                >
                  <Select {...register("currentCountry")}>
                    <option value="">{t("completeProfile.selectCountry")}</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label={t("completeProfile.currentCityLabel")}
                  required
                  error={errors.currentCity?.message}
                >
                  <Input
                    {...register("currentCity")}
                    placeholder={t("completeProfile.cityPlaceholder")}
                    autoComplete="address-level2"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Section 3: Document Uploads */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              {t("completeProfile.uploadsHeading")}
            </h2>
            <div className="space-y-4">
              <FileField
                label={
                  documentType === "TAZKIRA"
                    ? t("completeProfile.tazkiraPhotoLabel")
                    : t("completeProfile.passportPhotoLabel")
                }
                required
                error={fileErrors.passport}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                hint={t("completeProfile.uploadHint")}
                onChange={(file) => {
                  setPassportFile(file);
                  setFileErrors((prev) => ({ ...prev, passport: undefined }));
                }}
                fileName={passportFile?.name}
              />

              <FileField
                label={t("completeProfile.facePhotoLabel")}
                required
                error={fileErrors.face}
                accept="image/jpeg,image/png,image/webp"
                hint={t("completeProfile.uploadHint")}
                onChange={(file) => {
                  setFaceFile(file);
                  setFileErrors((prev) => ({ ...prev, face: undefined }));
                }}
                fileName={faceFile?.name}
              />
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>{t("completeProfile.photoRequirementsTitle")}</strong>{" "}
                  {t("completeProfile.photoRequirementsBody")}
                </p>
              </div>

              {visaRequired && (
                <FileField
                  label={t("completeProfile.visaLabel")}
                  required
                  error={fileErrors.visa}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  hint={t("completeProfile.uploadHint")}
                  onChange={(file) => {
                    setVisaFile(file);
                    setFileErrors((prev) => ({ ...prev, visa: undefined }));
                  }}
                  fileName={visaFile?.name}
                />
              )}

              <div className="rounded-lg border border-brand-secondary/20 bg-brand-secondary/5 p-3">
                <p className="text-xs text-brand-muted leading-relaxed">
                  🔒 <strong>{t("completeProfile.securityNoteBold")}</strong>{" "}
                  {t("completeProfile.securityNoteBody")}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("completeProfile.submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
