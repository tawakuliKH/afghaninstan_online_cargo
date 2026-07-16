import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";

function NextStepsProgress({ step }: { step: 2 | 3 }) {
  const { t } = useTranslation();
  const steps = [
    { n: 1, label: t("onboardingSteps.accountCreated") },
    { n: 2, label: t("onboardingSteps.completeProfile") },
    { n: 3, label: t("onboardingSteps.getApproved") },
  ];
  return (
    <div className="mb-4 flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                s.n < step
                  ? "bg-green-500 text-white"
                  : s.n === step
                  ? "animate-pulse bg-brand-accent text-white"
                  : "bg-brand-muted/10 text-brand-muted"
              }`}
            >
              {s.n < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
            </div>
            <span className="hidden text-xs text-brand-muted sm:inline">
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="h-px w-6 bg-brand-muted/20 sm:w-8" />
          )}
        </div>
      ))}
    </div>
  );
}

// Persistent onboarding reminder shown on every page for a logged-in user
// whose account is still PENDING — guides them toward completing KYC and
// tracks review status. Hidden on /profile/complete itself since that page
// already conveys the same message inline.
export function ProfileProgressBanner() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || user.accountStatus !== "PENDING") return null;
  if (location.pathname === "/profile/complete") return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      {!user.profileCompleted ? (
        <div className="rounded-xl border-l-4 border-brand-accent bg-white p-6 shadow-sm">
          <NextStepsProgress step={2} />
          <h2 className="text-lg font-bold text-brand-primary">
            {t("profileBanner.welcomeTitle")}
          </h2>
          <p className="mt-3 text-sm text-brand-muted">
            {t("profileBanner.welcomeBody")}
          </p>
          <button
            onClick={() => navigate("/profile/complete")}
            className="mt-4 w-full rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
          >
            {t("profileBanner.completeButton")}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border-l-4 border-brand-secondary bg-white p-6 shadow-sm">
          <NextStepsProgress step={3} />
          <h2 className="text-lg font-bold text-brand-primary">
            {t("profileBanner.underReviewTitle")}
          </h2>
          <p className="mt-3 text-sm text-brand-muted">
            {t("profileBanner.underReviewBody")}
          </p>
          <p className="mt-3 text-xs text-brand-muted/70">
            {t("profileBanner.underReviewEta")}
          </p>
        </div>
      )}
    </div>
  );
}
