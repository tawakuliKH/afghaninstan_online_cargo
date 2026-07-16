import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { Package, Loader2, AlertCircle, X, Eye, EyeOff } from "lucide-react";
import { SEO } from "../components/SEO";
import { GoogleSignInButton } from "../components/GoogleSignInButton";

// ── Structured Data ─────────────────────────────────────────

const REGISTER_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Create Account — Afghanistan Online Cargo",
  "alternateName": "ثبت‌نام — کارگو آنلاین افغانستان",
  "description": "Register on Afghanistan Online Cargo. Create your free account in seconds, then complete your KYC profile to get approved.",
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

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Zod validation messages must be reactive to the active language, so the
  // schema is rebuilt whenever it changes rather than defined at module scope.
  const registerSchema = useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(1, t("register.firstNameRequired")),
          lastName: z.string().min(1, t("register.lastNameRequired")),
          email: z.string().email(t("register.invalidEmail")),
          confirmEmail: z.string().email(t("register.invalidEmail")),
          whatsappNumber: z.string().min(5, t("register.whatsappRequired")),
          password: z.string().min(8, t("register.passwordMinLength")),
          confirmPassword: z.string(),
        })
        .refine((d) => d.email === d.confirmEmail, {
          message: t("register.emailsDontMatch"),
          path: ["confirmEmail"],
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t("register.passwordsDontMatch"),
          path: ["confirmPassword"],
        }),
    [t]
  );

  type RegisterForm = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema) as any,
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    setRegisterError(null);
    try {
      const res = await api.post("/auth/register-quick", data);
      setAuth(res.data.user, res.data.accessToken);
      toast.success(t("register.toastSuccess"));
      navigate("/");
    } catch (err: any) {
      const msg =
        err.response?.data?.error || t("register.toastFailed");
      setRegisterError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <SEO
        titleEn="Join Afghanistan Online Cargo — Create Your Account"
        titleFa="به کارگو آنلاین افغانستان بپیوندید — حساب خود را بسازید"
        descriptionEn="Register on Afghanistan Online Cargo in seconds. Free to join — complete your KYC profile afterward to get approved."
        descriptionFa="در کارگو آنلاین افغانستان در چند ثانیه ثبت‌نام کنید. پیوستن رایگان است — سپس پروفایل خود را تکمیل کنید تا تأیید شوید."
        keywordsEn="register Afghanistan cargo, join Afghan delivery, create account Afghan cargo, Afghan traveler register, Afghan sender register, ثبت نام کارگو افغانستان"
        keywordsFa="ثبت نام کارگو افغانستان، پیوستن به تحویل افغانی، ساختن حساب کارگو افغانی"
        path="/register"
        noIndex={false}
        structuredData={REGISTER_STRUCTURED_DATA}
      />

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-full bg-brand-primary/10 p-3">
              <Package className="h-8 w-8 text-brand-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-brand-primary">
            {t("register.createAccount")}
          </h1>

          {/* Trust badges */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              🔒 {t("register.freeTag")}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              🛡️ {t("register.kycVerifiedTag")}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-brand-primary/5 px-3 py-1 text-xs font-medium text-brand-primary">
              ✅ {t("register.adminReviewedTag")}
            </span>
          </div>
        </div>

        {/* Google sign-up */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-brand-muted/20" />
            <span className="text-xs text-brand-muted">{t("register.orSignUpGoogle")}</span>
            <div className="h-px flex-1 bg-brand-muted/20" />
          </div>
          <GoogleSignInButton />
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-brand-muted/20" />
            <span className="text-xs text-brand-muted">{t("register.orContinueEmail")}</span>
            <div className="h-px flex-1 bg-brand-muted/20" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t("register.firstNameLabel")} <span className="text-brand-danger">*</span>
              </label>
              <input
                {...register("firstName")}
                autoComplete="given-name"
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-brand-danger">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t("register.lastNameLabel")} <span className="text-brand-danger">*</span>
              </label>
              <input
                {...register("lastName")}
                autoComplete="family-name"
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-brand-danger">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-primary">
              {t("register.emailLabel")} <span className="text-brand-danger">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-brand-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-primary">
              {t("register.confirmEmailLabel")} <span className="text-brand-danger">*</span>
            </label>
            <input
              {...register("confirmEmail")}
              type="email"
              placeholder={t("register.confirmEmailPlaceholder")}
              autoComplete="email"
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
            {errors.confirmEmail && (
              <p className="mt-1 text-xs text-brand-danger">{errors.confirmEmail.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-primary">
              {t("register.whatsappLabel")} <span className="text-brand-danger">*</span>
            </label>
            <input
              {...register("whatsappNumber")}
              placeholder="+1 234 567 8900"
              autoComplete="tel"
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
            {errors.whatsappNumber && (
              <p className="mt-1 text-xs text-brand-danger">{errors.whatsappNumber.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-primary">
              {t("register.passwordLabel")} <span className="text-brand-danger">*</span>
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("register.passwordPlaceholder")}
                autoComplete="new-password"
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 pr-10 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-brand-danger">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-primary">
              {t("register.confirmPasswordLabel")} <span className="text-brand-danger">*</span>
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("register.confirmPasswordPlaceholder")}
                autoComplete="new-password"
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 pr-10 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-brand-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          {registerError && (
            <div className="flex items-start gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p>{registerError}</p>
                {registerError.toLowerCase().includes("already") && (
                  <Link to="/login" className="mt-1 inline-block font-medium underline">
                    {t("register.signInInstead")}
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => setRegisterError(null)}
                aria-label={t("register.dismiss")}
                className="shrink-0 text-brand-danger/70 hover:text-brand-danger"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("register.submitButton")}
          </button>

          <p className="text-center text-sm text-brand-muted">
            {t("register.alreadyHaveAccount")}{" "}
            <Link
              to="/login"
              className="font-medium text-brand-accent hover:underline"
            >
              {t("register.signIn")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
