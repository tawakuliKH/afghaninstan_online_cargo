import { useTranslation } from "react-i18next";
import { SEO } from "../components/SEO";
import { Package } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.afghancargo.app";
const APP_STORE_URL = "https://apps.apple.com/app/afghanistan-online-cargo/id000000000";
// const APK_DIRECT_URL = "https://afghancargo.online/downloads/afghancargo.apk";

function GetApp() {
  const { t, i18n } = useTranslation();
  const isDari = i18n.language === "fa-AF";
  return (
    <div className="min-h-screen bg-brand-bg">
      <SEO
        titleEn="Download the App — Afghanistan Online Cargo"
        titleFa="دانلود اپلیکیشن — کارگو آنلاین افغانستان"
        descriptionEn="Download the Afghanistan Online Cargo mobile app for Android and iOS. Send and receive packages between Afghanistan and the world from your phone."
        descriptionFa="اپلیکیشن موبایل کارگو آنلاین افغانستان را برای اندروید و iOS دانلود کنید. بسته‌ها را از گوشی خود بین افغانستان و جهان ارسال و دریافت کنید."
        path="/get-app"
      />

      {/* Hero */}
      <div className="bg-brand-primary px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex justify-center">
            <div className="rounded-3xl bg-brand-accent/20 p-6">
              <Package className="h-16 w-16 text-brand-accent" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
            Afghanistan Online Cargo
          </h1>
          {isDari && (
            <p className="mb-1 text-sm font-medium text-brand-accent">
              کارگو آنلاین افغانستان
            </p>
          )}
          <p className="mb-8 text-white/70">
            {t("getApp.heroTagline")}
          </p>
        </div>
      </div>

      {/* Download options */}
      <div className="mx-auto max-w-3xl px-4 py-16">

        {/* App Store badges */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">

          {/* Google Play */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md border border-brand-muted/10 group"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/5">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
                <path d="M3.18 23.76c.3.17.64.24.99.2L15.54 12 3.18.04A1.5 1.5 0 0 0 3 .76v22.5c0 .18.07.35.18.5z" fill="#EA4335"/>
                <path d="M19.82 9.6 16.88 8 3.18.04l12.36 11.96 4.28-2.4z" fill="#FBBC05"/>
                <path d="M19.82 14.4l-4.28-2.4L3.18 23.96l13.7-7.96 2.94-1.6z" fill="#34A853"/>
                <path d="M19.82 9.6l-2.94 1.6v1.6l2.94 1.6A1.5 1.5 0 0 0 21 13.5v-3a1.5 1.5 0 0 0-1.18-1.9z" fill="#4285F4"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-brand-muted">{t("getApp.downloadOn")}</p>
              <p className="text-lg font-bold text-brand-primary group-hover:text-brand-accent transition">
                {t("getApp.googlePlay")}
              </p>
              <p className="text-xs text-brand-muted">{t("getApp.android")}</p>
            </div>
          </a>

          {/* App Store */}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md border border-brand-muted/10 group"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/5">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#1C1C1E">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-brand-muted">{t("getApp.downloadOnThe")}</p>
              <p className="text-lg font-bold text-brand-primary group-hover:text-brand-accent transition">
                {t("getApp.appStore")}
              </p>
              <p className="text-xs text-brand-muted">{t("getApp.iphoneIpad")}</p>
            </div>
          </a>
        </div>

        {/* Coming soon notice */}
        <div className="rounded-2xl bg-brand-primary/5 border border-brand-primary/10 p-6 text-center">
          <p className="text-sm font-medium text-brand-primary">
            {t("getApp.comingSoon")}
          </p>
          <p className="mt-3 text-xs text-brand-muted">
            {t("getApp.inMeantime")}{" "}
            <a href="https://afghancargo.online" className="font-medium text-brand-accent hover:underline">
              afghancargo.online
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}

export default GetApp;
