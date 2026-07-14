import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
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

const countries = getData().sort((a, b) => a.name.localeCompare(b.name));

interface EditProfileForm {
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
  onChange,
  fileName,
}: {
  label: string;
  onChange: (file: File) => void;
  fileName?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-primary">
        {label}
        <span
          title="Changing this document will send your account back for re-approval"
          className="inline-flex"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
        </span>
      </label>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-brand-muted/40 bg-brand-bg px-4 py-3 transition hover:border-brand-primary">
        {fileName ? (
          <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
        ) : (
          <Upload className="h-5 w-5 shrink-0 text-brand-muted" />
        )}
        <span className="text-sm text-brand-muted">
          {fileName || "Click to replace (leave empty to keep current file)"}
        </span>
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
          nickname: u.nickname || "",
          whatsappNumber: u.whatsappNumber || "",
          permanentCountry: u.permanentCountry || "",
          permanentCity: u.permanentCity || "",
          currentCountry: u.currentCountry || "",
          currentCity: u.currentCity || "",
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [reset]);

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
        toast.success(
          "Profile updated. Your account is pending re-approval."
        );
      } else {
        toast.success("Profile updated successfully!");
      }
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await api.delete("/auth/me");
      updateUser({ accountStatus: "SUSPENDED" });
      toast.success(res.data.message || "Deletion request submitted");
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit deletion request");
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
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-brand-primary">
          Edit Profile
        </h1>

        <div className="mb-6 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Note: Any profile changes require admin re-approval. Your account
            will be set to Pending until an admin reviews your changes.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Field label="Nickname" error={errors.nickname?.message}>
              <Input
                {...register("nickname", { required: "Nickname is required" })}
                placeholder="Your public name"
              />
            </Field>
            <Field
              label="WhatsApp number"
              error={errors.whatsappNumber?.message}
            >
              <Input
                {...register("whatsappNumber", {
                  required: "WhatsApp number is required",
                })}
                placeholder="+1 234 567 8900"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Permanent country">
                <Select {...register("permanentCountry")}>
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Permanent city">
                <Input {...register("permanentCity")} placeholder="City" />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Current country">
                <Select {...register("currentCountry")}>
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Current city">
                <Input {...register("currentCity")} placeholder="City" />
              </Field>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-muted">
              Replace Documents — optional
            </h2>
            <div className="space-y-4">
              <FileField
                label="Passport / Tazkira photo"
                onChange={setPassportFile}
                fileName={passportFile?.name}
              />
              <FileField
                label="Face photo"
                onChange={setFaceFile}
                fileName={faceFile?.name}
              />
              <FileField
                label="Visa / residency document"
                onChange={setVisaFile}
                fileName={visaFile?.name}
              />
              <p className="flex items-center gap-1.5 text-xs text-brand-muted">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                Replacing any document above sends your account back for
                admin re-approval.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </form>

        <div className="mt-10 border-t border-brand-muted/10 pt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-danger">
            Danger Zone
          </h2>
          <p className="mb-3 text-xs text-brand-muted">
            Deleting your account immediately hides you and your listings from
            other users. An admin can still review your deletion request.
            Delivery records are preserved for legal purposes.
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
            Delete Account
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        variant="danger"
        title="Delete your account?"
        message="This will immediately hide you and your listings from other users. Delivery records are preserved for legal purposes. This cannot be undone once actioned."
        confirmLabel="Delete Account"
        loading={deleting}
      />
    </div>
  );
}

export default EditProfile;
