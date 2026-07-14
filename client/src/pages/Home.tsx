import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/axios";
import { useAuthStore } from "../store/authStore";
import { WorkflowDashboard } from "../components/WorkflowDashboard";
import { SEO } from "../components/SEO";
import {
  MapPin,
  Package,
  ArrowRight,
  Shield,
  Clock,
  Users,
} from "lucide-react";

// ── Structured Data ─────────────────────────────────────────

const HOME_STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Afghanistan Online Cargo",
    "alternateName": ["کارگو آنلاین افغانستان", "Afghan Cargo Online"],
    "url": "https://afghancargo.online",
    "logo": "https://afghancargo.online/favicon.svg",
    "image": "https://afghancargo.online/og-image.svg",
    "description": "KYC-verified cross-border package coordination platform connecting Afghan senders and travelers worldwide.",
    "foundingDate": "2026",
    "founder": {
      "@type": "Person",
      "name": "Khadim Tawakuli",
      "url": "https://tawakuli.dev"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "tawakuli456@gmail.com",
      "availableLanguage": ["English", "Dari", "Persian"]
    },
    "sameAs": ["https://tawakuli.dev", "https://github.com/tawakuliKH"]
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Afghanistan Online Cargo",
    "alternateName": "کارگو آنلاین افغانستان",
    "serviceType": "Cross-Border Package Delivery Coordination",
    "description": "Connect with KYC-verified Afghan travelers to send packages to and from Afghanistan. Legally recorded handovers, safe and trusted by the Afghan community worldwide.",
    "url": "https://afghancargo.online",
    "areaServed": [
      { "@type": "Country", "name": "Afghanistan" },
      { "@type": "Country", "name": "Germany" },
      { "@type": "Country", "name": "United States" },
      { "@type": "Country", "name": "United Arab Emirates" },
      { "@type": "Country", "name": "Iran" },
      { "@type": "Country", "name": "Turkey" },
      { "@type": "Country", "name": "United Kingdom" },
      { "@type": "Country", "name": "Australia" },
      { "@type": "Country", "name": "Canada" },
      { "@type": "Country", "name": "Sweden" },
      { "@type": "Country", "name": "Norway" },
      { "@type": "Country", "name": "Netherlands" },
      { "@type": "Country", "name": "Pakistan" }
    ],
    "availableLanguage": [
      { "@type": "Language", "name": "English" },
      { "@type": "Language", "name": "Dari", "alternateName": "دری" },
      { "@type": "Language", "name": "Persian", "alternateName": "فارسی" }
    ],
    "offers": {
      "@type": "Offer",
      "description": "Free to register. 5% platform commission on completed deliveries paid by the traveler.",
      "price": "0",
      "priceCurrency": "USD"
    },
    "termsOfService": "https://afghancargo.online/rules",
    "featureList": [
      "KYC Identity Verification",
      "Cross-border package coordination",
      "Legally recorded handovers",
      "5-step delivery tracking",
      "In-app and email notifications",
      "Bilingual English and Dari interface",
      "Secure document storage",
      "Admin-reviewed accounts"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I send a package to Afghanistan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Register on Afghanistan Online Cargo with your verified ID, post your package listing with origin and destination details, then connect with a verified Afghan traveler heading to your destination. Agree on terms, propose the delivery officially, and track every step through the platform."
        }
      },
      {
        "@type": "Question",
        "name": "چطور بسته‌ام را به افغانستان بفرستم؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "در Afghanistan Online Cargo با هویت تأیید شده ثبت‌نام کنید، لیست بسته خود را با جزئیات مبدأ و مقصد ارسال کنید، سپس با یک مسافر افغان تأیید شده که به مقصد شما می‌رود ارتباط برقرار کنید. شرایط را توافق کنید و تحویل را رسمی پیشنهاد دهید."
        }
      },
      {
        "@type": "Question",
        "name": "Is Afghanistan Online Cargo safe and verified?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All users must complete KYC verification with a valid passport or Afghan Tazkira, a face photo, and visa or residency documents if living outside Afghanistan. Every account is manually reviewed and approved by administrators before accessing platform features."
        }
      },
      {
        "@type": "Question",
        "name": "آیا Afghanistan Online Cargo امن و تأیید شده است؟",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "بله. همه کاربران باید با پاسپورت یا تذکره افغانی معتبر، عکس چهره و اسناد ویزا یا اقامت در صورت زندگی خارج از افغانستان، تأیید هویت KYC را تکمیل کنند. هر حساب توسط مدیران به صورت دستی بررسی و تأیید می‌شود."
        }
      },
      {
        "@type": "Question",
        "name": "What countries does Afghanistan Online Cargo serve?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Afghanistan Online Cargo serves the global Afghan diaspora. Packages can be coordinated between Afghanistan and Germany, USA, UAE, Iran, Turkey, UK, Australia, Canada, Sweden, Norway, Netherlands, Pakistan, and any other country where Afghan travelers are registered."
        }
      },
      {
        "@type": "Question",
        "name": "How does the 5-step delivery process work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The delivery process has 5 steps: (1) Sender posts package, (2) Sender proposes delivery to a verified traveler, (3) Traveler accepts and confirms, (4) Traveler delivers and finalizes the delivery, (5) Sender leaves a review. Every step is recorded with timestamps as legal evidence."
        }
      }
    ]
  }
]

// ── Hero animation ──────────────────────────────────────────

function HeroAnimation() {
  return (
    <div className="relative flex h-48 items-center justify-center overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 120">
        <motion.path
          d="M 30 90 Q 200 10 370 90"
          fill="none"
          stroke="#2DB7C4"
          strokeWidth="2"
          strokeDasharray="8 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.circle
          cx="30"
          cy="90"
          r="5"
          fill="#F2A60D"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        />
        <motion.circle
          cx="370"
          cy="90"
          r="5"
          fill="#F2A60D"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.8 }}
        />
      </svg>

      <motion.div
        className="absolute text-3xl"
        initial={{ x: -160, y: 30 }}
        animate={{ x: 160, y: -20 }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 1.5,
        }}
      >
        ✈️
      </motion.div>

      <motion.div
        className="absolute bottom-2 left-4 text-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs font-semibold text-brand-accent">کابل</p>
        <p className="text-xs text-white/60">Kabul</p>
      </motion.div>

      <motion.div
        className="absolute bottom-2 right-4 text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <p className="text-xs font-semibold text-brand-accent">Frankfurt</p>
        <p className="text-xs text-white/60">Germany</p>
      </motion.div>
    </div>
  );
}

// ── How it works ────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      icon: Users,
      title: "Verify your identity",
      titleFa: "هویت خود را تأیید کنید",
      desc: "Register with your passport or Tazkira. Every user is manually reviewed and approved.",
      descFa: "با پاسپورت یا تذکره خود ثبت‌نام کنید. هر کاربر به صورت دستی بررسی و تأیید می‌شود.",
    },
    {
      icon: Package,
      title: "Post or find",
      titleFa: "پست کنید یا پیدا کنید",
      desc: "Senders post packages. Travelers post trips. Find each other and connect directly.",
      descFa: "فرستندگان بسته پست می‌کنند. مسافران سفر پست می‌کنند. همدیگر را پیدا کنید و مستقیم ارتباط برقرار کنید.",
    },
    {
      icon: Shield,
      title: "Hand over safely",
      titleFa: "با امنیت تحویل دهید",
      desc: "Meet in person, verify ID, and hand over the package. The platform records every step as legal proof.",
      descFa: "حضوری ملاقات کنید، هویت را تأیید کنید و بسته را تحویل دهید. پلتفرم هر مرحله را به عنوان مدرک قانونی ثبت می‌کند.",
    },
    {
      icon: Clock,
      title: "Track & confirm",
      titleFa: "پیگیری و تأیید کنید",
      desc: "Both parties confirm handover and final delivery. Reviews build trust over time.",
      descFa: "هر دو طرف تحویل و تحویل نهایی را تأیید می‌کنند. نظرات اعتماد را در طول زمان ایجاد می‌کنند.",
    },
  ];

  return (
    <div className="py-16">
      <h2 className="mb-2 text-center text-2xl font-bold text-brand-primary">
        How Afghanistan Online Cargo Works
      </h2>
      <p className="mb-10 text-center text-sm text-brand-muted">
        A trusted coordination platform — not a courier. All handovers happen in
        person between verified users.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl bg-white p-6 shadow-sm text-center"
            >
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-brand-primary/10 p-3">
                  <Icon className="h-6 w-6 text-brand-primary" />
                </div>
              </div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-accent">
                Step {i + 1}
              </p>
              <h3 className="mb-1 font-semibold text-brand-primary">
                {step.title}
              </h3>
              <p className="mb-1 text-xs font-medium text-brand-muted/70">
                {step.titleFa}
              </p>
              <p className="text-xs text-brand-muted">{step.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Trust badges ────────────────────────────────────────────

function TrustBadges() {
  const badges = [
    { label: "KYC Verified Users", labelFa: "کاربران تأیید هویت شده", icon: "🛡️" },
    { label: "Legally Recorded", labelFa: "ثبت قانونی", icon: "⚖️" },
    { label: "Afghan Community", labelFa: "جامعه افغان", icon: "🤝" },
    { label: "Cross-Border Safe", labelFa: "امن بین المللی", icon: "✈️" },
  ]
  return (
    <div className="border-y border-brand-muted/10 bg-white py-6">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xl">{b.icon}</span>
              <div>
                <p className="text-xs font-semibold text-brand-primary">{b.label}</p>
                <p className="text-xs text-brand-muted">{b.labelFa}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Mini card components ────────────────────────────────────

function TripMiniCard({ trip }: { trip: any }) {
  const isClosed = new Date(trip.departureDate) < new Date();
  return (
    <Link
      to={`/trips/${trip.id}`}
      className={`block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md ${
        isClosed ? "opacity-60 grayscale-[30%]" : ""
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-accent" />
          <span className="text-sm font-medium text-brand-primary">
            {trip.originCity} → {trip.destCity}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isClosed
              ? "bg-brand-muted/10 text-brand-muted"
              : "bg-green-100 text-green-700"
          }`}
        >
          {isClosed ? "Trip Closed" : "Active"}
        </span>
      </div>
      <p className="text-xs text-brand-muted">
        {trip.originCountry} → {trip.destCountry}
      </p>
      <p className="mt-2 text-xs text-brand-muted">
        Departure: {new Date(trip.departureDate).toLocaleDateString()}
      </p>
      <p className="mt-1 text-xs text-brand-muted">
        By: {trip.traveler?.nickname}
      </p>
    </Link>
  );
}

function PackageMiniCard({ pkg }: { pkg: any }) {
  return (
    <Link
      to={`/packages/${pkg.id}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      {pkg.goodsPhotoUrl ? (
        <img
          src={pkg.goodsPhotoUrl}
          alt={pkg.title}
          className="mb-3 h-28 w-full rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="mb-3 flex h-28 w-full items-center justify-center rounded-lg bg-brand-primary/5 border border-brand-muted/10">
          <div className="flex flex-col items-center gap-1 text-brand-primary/30">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 fill-none stroke-current stroke-1"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="text-xs">No photo</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-4 w-4 text-brand-accent" />
        <span className="text-sm font-medium text-brand-primary">
          {pkg.title}
        </span>
      </div>
      <p className="text-xs text-brand-muted">
        {pkg.originCity} → {pkg.destCity}
      </p>
      <p className="mt-2 text-xs text-brand-muted">{pkg.weight} kg</p>
      <p className="mt-1 text-xs text-brand-muted">
        By: {pkg.sender?.nickname}
      </p>
    </Link>
  );
}

// ── Main Home page ──────────────────────────────────────────

function Home() {
  const { user } = useAuthStore();
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [recentPackages, setRecentPackages] = useState<any[]>([]);

  useEffect(() => {
    api.get("/trips?page=1").then((res) => {
      setRecentTrips(res.data.trips.slice(0, 3));
    });
    api.get("/packages?page=1").then((res) => {
      setRecentPackages(res.data.packages.slice(0, 3));
    });
  }, []);

  return (
    <div>
      <SEO
        titleEn="Send Packages to Afghanistan — KYC-Verified Travelers"
        titleFa="ارسال بسته به افغانستان — مسافران تأیید شده"
        descriptionEn="Connect with KYC-verified Afghan travelers to send packages between Afghanistan and Europe, USA, UAE, Iran, Turkey and worldwide. Safe, legally recorded, trusted by the Afghan community."
        descriptionFa="با مسافران تأیید شده افغان برای ارسال بسته بین افغانستان و اروپا، امریکا، امارات، ایران، ترکیه و سراسر جهان ارتباط برقرار کنید. امن، ثبت قانونی، مورد اعتماد جامعه افغان."
        keywordsEn="send package Afghanistan, Afghan travelers Europe, cargo Kabul, Afghan delivery USA, cross-border Afghanistan package, verified Afghan courier, send parcel to Afghanistan, Afghan cargo online"
        keywordsFa="ارسال بسته افغانستان، مسافر افغانستان اروپا، کارگو کابل، تحویل افغان امریکا، بسته بین المللی افغانستان، پیک افغانی تأیید شده، ارسال پارسل به افغانستان، کارگو آنلاین افغانستان"
        path="/"
        structuredData={HOME_STRUCTURED_DATA}
      />

      {/* Hero */}
      <section className="bg-brand-primary px-4 py-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-1 text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
        >
          Afghanistan Online Cargo
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-1 text-sm text-brand-accent font-medium"
        >
          کارگو آنلاین افغانستان
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mb-8 max-w-xl text-sm text-white/70 sm:text-base"
        >
          Connect verified senders and travelers for safe, coordinated
          cross-border package delivery between Afghanistan and the world.
        </motion.p>

        <HeroAnimation />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Link
            to="/trips"
            className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Browse Trips — مشاهده سفرها
          </Link>
          <Link
            to="/packages"
            className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Browse Packages — مشاهده بسته‌ها
          </Link>
          {!user && (
            <Link
              to="/register"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-white/90"
            >
              Get Started — شروع کنید
            </Link>
          )}
        </motion.div>
      </section>

      {/* Trust badges */}
      <TrustBadges />

      {/* Logged-in activity section */}
      {user && user.accountStatus === "APPROVED" && (
        <section className="bg-brand-bg px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-6 text-xl font-bold text-brand-primary">
              Welcome back, {user.nickname}! Here's your activity:
            </h2>
            <WorkflowDashboard />
          </div>
        </section>
      )}
      {user && user.accountStatus === "PENDING" && (
        <section className="bg-brand-bg px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
              <Clock className="h-5 w-5 shrink-0 text-yellow-600" />
              <p className="text-sm text-brand-muted">
                Your account is pending approval. You'll be notified as soon as
                an admin reviews your application.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <div className="mx-auto max-w-6xl px-4">
        <HowItWorks />

        {/* Recent Trips + Packages */}
        <div className="pb-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-primary">
                  Recent Trips — سفرهای اخیر
                </h2>
                <Link
                  to="/trips"
                  className="flex items-center gap-1 text-sm text-brand-accent hover:underline"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {recentTrips.length === 0 ? (
                <p className="text-sm text-brand-muted">No trips posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentTrips.map((trip) => (
                    <TripMiniCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-primary">
                  Recent Packages — بسته‌های اخیر
                </h2>
                <Link
                  to="/packages"
                  className="flex items-center gap-1 text-sm text-brand-accent hover:underline"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {recentPackages.length === 0 ? (
                <p className="text-sm text-brand-muted">
                  No packages posted yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentPackages.map((pkg) => (
                    <PackageMiniCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom CTA for non-logged-in users */}
        {!user && (
          <div className="mb-16 rounded-2xl bg-brand-primary p-8 text-center">
            <h2 className="mb-2 text-xl font-bold text-white">
              Ready to get started?
            </h2>
            <p className="mb-2 text-sm text-white/60">آماده شروع هستید؟</p>
            <p className="mb-6 text-sm text-white/70">
              Join thousands of verified Afghan senders and travelers worldwide.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Create Free Account — ثبت‌نام رایگان
              </Link>
              <Link
                to="/rules"
                className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Read the Rules — قوانین را بخوانید
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;