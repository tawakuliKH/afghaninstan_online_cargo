import { SEO } from "../components/SEO";
import { Package } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.afghancargo.app";
const APP_STORE_URL = "https://apps.apple.com/app/afghanistan-online-cargo/id000000000";
// const APK_DIRECT_URL = "https://afghancargo.online/downloads/afghancargo.apk";

function GetApp() {
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
          <p className="mb-1 text-sm font-medium text-brand-accent">
            کارگو آنلاین افغانستان
          </p>
          <p className="mb-8 text-white/70">
            Send and receive packages between Afghanistan and the world —
            right from your phone.
          </p>
          <p className="text-xs text-white/50">
            بسته‌ها را بین افغانستان و جهان از گوشی خود ارسال و دریافت کنید.
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
              <p className="text-xs text-brand-muted">Download on</p>
              <p className="text-lg font-bold text-brand-primary group-hover:text-brand-accent transition">
                Google Play
              </p>
              <p className="text-xs text-brand-muted">Android</p>
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
              <p className="text-xs text-brand-muted">Download on the</p>
              <p className="text-lg font-bold text-brand-primary group-hover:text-brand-accent transition">
                App Store
              </p>
              <p className="text-xs text-brand-muted">iPhone & iPad</p>
            </div>
          </a>
        </div>

        {/* Direct APK download */}
        {/* <div className="mb-12 rounded-2xl border border-brand-muted/20 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-brand-primary">
                Direct APK Download
              </h3>
              <p className="mt-1 text-xs text-brand-muted">
                For Android users who prefer to install directly without Google Play.
                Enable "Install from unknown sources" in your Android settings.
              </p>
              <p className="mt-1 text-xs text-brand-muted/70">
                برای کاربران اندروید که ترجیح می‌دهند بدون Google Play نصب کنند.
              </p>
            </div>
            <a
              href={APK_DIRECT_URL}
              className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Download APK
            </a>
          </div>
        </div> */}

        {/* Features */}
        {/* <div className="mb-12">
          <h2 className="mb-6 text-center text-xl font-bold text-brand-primary">
            Everything in your pocket
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { icon: "📦", title: "Post packages", titleFa: "ارسال بسته", desc: "Post your package and find a verified traveler to carry it." },
              { icon: "✈️", title: "Post trips", titleFa: "ارسال سفر", desc: "Traveling? Post your trip and earn by carrying packages." },
              { icon: "🛡️", title: "KYC verified", titleFa: "تأیید هویت", desc: "All users are manually verified with identity documents." },
              { icon: "⚖️", title: "Legal records", titleFa: "ثبت قانونی", desc: "Every handover is timestamped as legal evidence." },
              { icon: "💬", title: "Direct messaging", titleFa: "پیام مستقیم", desc: "Chat directly with senders and travelers." },
              { icon: "🔔", title: "Push notifications", titleFa: "اعلان‌های فوری", desc: "Get notified instantly for every step of your delivery." },
              { icon: "💰", title: "Wallet & earnings", titleFa: "کیف پول و درآمد", desc: "Track your earnings and commission as a traveler." },
              { icon: "🌐", title: "English & Dari", titleFa: "انگلیسی و دری", desc: "Full bilingual support with RTL Dari interface." },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold text-brand-primary">{f.title}</p>
                  <p className="text-xs text-brand-muted/70">{f.titleFa}</p>
                  <p className="mt-1 text-xs text-brand-muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div> */}

        {/* Coming soon notice */}
        <div className="rounded-2xl bg-brand-primary/5 border border-brand-primary/10 p-6 text-center">
          <p className="text-sm font-medium text-brand-primary">
            🚀 App coming soon — currently in development
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            اپلیکیشن به زودی منتشر می‌شود — در حال توسعه است
          </p>
          <p className="mt-3 text-xs text-brand-muted">
            In the meantime, use the web version at{" "}
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