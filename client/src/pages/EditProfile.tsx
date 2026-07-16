import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getData } from "country-list";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import {
  ArrowLeft,
  Loader2,
  Upload,
  CheckCircle,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import SEO from "../components/SEO";

const countries = getData().sort((a, b) => a.name.localeCompare(b.name));

interface EditProfileForm {
  firstName: string;
  lastName: string;
  nickname: string;
  whatsappNumber: string;
  permanentCountry: string;
  permanentCity: string;
  currentCountry: string;
  currentCity: string;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-primary">
        {label}
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
  tooltip,
  hint,
  onChange,
  fileName,
}: {
  label: string;
  tooltip: string;
  hint: string;
  onChange: (file: File) => void;
  fileName?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-primary">
        {label}
        <span title={tooltip} className="inline-flex">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-muted/40 bg-brand-bg px-4 py-3 transition hover:border-brand-primary">
        {fileName ? (
          <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
        ) : (
          <Upload className="h-5 w-5 shrink-0 text-brand-muted" />
        )}
        <span className="text-sm text-brand-muted">{fileName || hint}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onChange(e.target.files[0]);
          }}
        />
      </label>
    </div>
  );
}

function EditProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [visaFile, setVisaFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileForm>();

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        const u = res.data.user;
        reset({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          nickname: u.nickname || "",
          whatsappNumber: u.whatsappNumber || "",
          permanentCountry: u.permanentCountry || "",
          permanentCity: u.permanentCity || "",
          currentCountry: u.currentCountry || "",
          currentCity: u.currentCity || "",
        });
      })
      .catch(() => toast.error(t("editProfile.toastLoadFailed")))
      .finally(() => setLoading(false));
  }, [reset, t]);

  const onSubmit = async (data: EditProfileForm) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      if (passportFile) formData.append("passportPhoto", passportFile);
      if (faceFile) formData.append("facePhoto", faceFile);
      if (visaFile) formData.append("visaResidencyDoc", visaFile);

      const res = await api.patch("/auth/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser(res.data.user);

      if (res.data.user.accountStatus === "PENDING") {
        toast.success(t("editProfile.toastUpdatedPending"));
      } else {
        toast.success(t("editProfile.toastUpdatedSuccess"));
      }
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("editProfile.toastUpdateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await api.delete("/auth/me");
      updateUser({ accountStatus: "SUSPENDED" });
      toast.success(res.data.message || t("editProfile.toastDeletionSubmitted"));
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("editProfile.toastDeletionFailed"));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <SEO
        titleEn="Edit Profile"
        titleFa="ویرایش پروفایل"
        descriptionEn="Update your profile details and identity documents."
        descriptionFa="جزئیات پروفایل و اسناد هویتی خود را به‌روزرسانی کنید."
        path="/profile/edit"
        noIndex
      />
      <Link
        to="/profile"
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("editProfile.backToProfile")}
      </Link>

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-brand-primary">
          {t("editProfile.pageTitle")}
        </h1>

        <div className="mb-6 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("editProfile.reapprovalNotice")}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("editProfile.firstNameLabel")} error={errors.firstName?.message}>
                <Input
                  {...register("firstName", { required: t("editProfile.firstNameRequired") })}
                />
              </Field>
              <Field label={t("editProfile.lastNameLabel")} error={errors.lastName?.message}>
                <Input
                  {...register("lastName", { required: t("editProfile.lastNameRequired") })}
                />
              </Field>
            </div>
            <Field label={t("editProfile.nicknameLabel")} error={errors.nickname?.message}>
              <Input
                {...register("nickname", { required: t("editProfile.nicknameRequired") })}
                placeholder={t("editProfile.nicknamePlaceholder")}
              />
            </Field>
            <Field
              label={t("editProfile.whatsappLabel")}
              error={errors.whatsappNumber?.message}
            >
              <Input
                {...register("whatsappNumber", {
                  required: t("editProfile.whatsappRequired"),
                })}
                placeholder={t("editProfile.whatsappPlaceholder")}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("editProfile.permanentCountryLabel")}>
                <Select {...register("permanentCountry")}>
                  <option value="">{t("editProfile.selectCountry")}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("editProfile.permanentCityLabel")}>
                <Input {...register("permanentCity")} placeholder={t("editProfile.cityPlaceholder")} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={t("editProfile.currentCountryLabel")}>
                <Select {...register("currentCountry")}>
                  <option value="">{t("editProfile.selectCountry")}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("editProfile.currentCityLabel")}>
                <Input {...register("currentCity")} placeholder={t("editProfile.cityPlaceholder")} />
              </Field>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              {t("editProfile.replaceDocsHeading")}
            </h2>
            <div className="space-y-4">
              <FileField
                label={t("editProfile.passportLabel")}
                tooltip={t("editProfile.docChangeWarningTooltip")}
                hint={t("editProfile.replaceFileHint")}
                onChange={setPassportFile}
                fileName={passportFile?.name}
              />
              <FileField
                label={t("editProfile.faceLabel")}
                tooltip={t("editProfile.docChangeWarningTooltip")}
                hint={t("editProfile.replaceFileHint")}
                onChange={setFaceFile}
                fileName={faceFile?.name}
              />
              <FileField
                label={t("editProfile.visaLabel")}
                tooltip={t("editProfile.docChangeWarningTooltip")}
                hint={t("editProfile.replaceFileHint")}
                onChange={setVisaFile}
                fileName={visaFile?.name}
              />
              <p className="flex items-center gap-1.5 text-xs text-brand-muted">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                {t("editProfile.replaceDocsNote")}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("editProfile.saveButton")}
          </button>
        </form>

        <div className="mt-10 border-t border-brand-muted/10 pt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-danger">
            {t("editProfile.dangerZoneHeading")}
          </h2>
          <p className="mb-3 text-xs text-brand-muted">
            {t("editProfile.dangerZoneBody")}
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="flex items-center gap-2 rounded-lg border border-brand-danger bg-white px-4 py-2 text-sm font-semibold text-brand-danger transition hover:bg-brand-danger/5 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t("editProfile.deleteAccountButton")}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        variant="danger"
        title={t("editProfile.deleteModalTitle")}
        message={t("editProfile.deleteModalMessage")}
        confirmLabel={t("editProfile.deleteAccountButton")}
        loading={deleting}
      />
    </div>
  );
}

export default EditProfile;
