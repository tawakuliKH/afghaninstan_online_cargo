import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import {
  Search,
  MapPin,
  Package,
  Weight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getData } from "country-list";
import { SEO } from "../components/SEO";

const countries = getData().sort((a, b) => a.name.localeCompare(b.name));

interface PackageItem {
  id: string;
  title: string;
  weight: number;
  originCountry: string;
  originCity: string;
  destCountry: string;
  destCity: string;
  notes?: string;
  goodsPhotoUrl?: string;
  createdAt: string;
  deliveryStatus?: "PROPOSED" | "ACCEPTED" | "FINALIZED" | "CANCELLED" | null;
  sender: {
    id: string;
    nickname: string;
    legalFullName?: string;
    whatsappNumber?: string;
    email?: string;
    rating: number;
    packagesDeliveredCount: number;
  };
}

// ── Structured Data ─────────────────────────────────────────

const PACKAGES_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Packages to Send — Afghanistan Online Cargo",
  "alternateName": "بسته‌های ارسالی — کارگو آنلاین افغانستان",
  "description": "Browse packages that need verified Afghan travelers to carry them cross-border. Find packages going to Afghanistan, Europe, USA, UAE, Iran, Turkey and worldwide.",
  "url": "https://afghancargo.online/packages",
  "inLanguage": ["en", "fa"],
  "isPartOf": {
    "@type": "WebSite",
    "name": "Afghanistan Online Cargo",
    "url": "https://afghancargo.online"
  },
  "about": {
    "@type": "Service",
    "name": "Package Listings for Cross-Border Delivery",
    "description": "Verified Afghan senders post packages that need to be carried across borders. Travelers browse these listings and earn by carrying packages on their trips."
  }
}

// ── Components ───────────────────────────────────────────────

function PackageStatusBadge({
  status,
}: {
  status?: PackageItem["deliveryStatus"];
}) {
  const { t } = useTranslation();
  const badges: Record<string, { label: string; className: string }> = {
    NONE: { label: t("packages.statusActive"), className: "bg-green-100 text-green-700" },
    PROPOSED: { label: t("packages.statusProposed"), className: "bg-yellow-100 text-yellow-700" },
    ACCEPTED: { label: t("packages.statusInTransit"), className: "bg-blue-100 text-blue-700" },
    FINALIZED: { label: t("packages.statusDelivered"), className: "bg-green-100 text-green-700" },
    CANCELLED: { label: t("packages.statusCancelled"), className: "bg-red-100 text-red-700" },
  };
  const badge = badges[status ?? "NONE"];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

interface SearchForm {
  originCountry: string;
  destCountry: string;
}

function ContactInfo({
  pkg,
  canSeeContact,
}: {
  pkg: PackageItem;
  canSeeContact: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  if (canSeeContact && (pkg.sender.whatsappNumber || pkg.sender.email)) {
    return (
      <div className="mt-3 space-y-1 border-t border-brand-muted/10 pt-3">
        {pkg.sender.whatsappNumber && (
          <p className="text-xs text-brand-muted">
            {t("contactInfo.whatsappLabel")}
            <a
              href={`https://wa.me/${pkg.sender.whatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {pkg.sender.whatsappNumber}
            </a>
          </p>
        )}
        {pkg.sender.email && (
          <p className="text-xs text-brand-muted">
            {t("contactInfo.emailLabel")}
            <a
              href={`mailto:${pkg.sender.email}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {pkg.sender.email}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-brand-muted/10 pt-3">
      <p className="text-xs italic text-brand-muted">
        {!user ? (
          <>
            <Link
              to="/register"
              onClick={(e) => e.stopPropagation()}
              className="text-brand-accent hover:underline"
            >
              {t("contactInfo.anonPrefix")}
            </Link>
            {t("contactInfo.anonSuffix")}
          </>
        ) : user.accountStatus === "APPROVED" ? (
          <>
            <Link
              to="/packages/new"
              onClick={(e) => e.stopPropagation()}
              className="text-brand-accent hover:underline"
            >
              {t("contactInfo.approvedPrefix")}
            </Link>
            {t("contactInfo.approvedSuffix")}
          </>
        ) : (
          t("contactInfo.pendingMessage")
        )}
      </p>
    </div>
  );
}

function PackageCard({
  pkg,
  viewerCanSeeContact,
}: {
  pkg: PackageItem;
  viewerCanSeeContact: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/packages/${pkg.id}`)}
      className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      {/* Photo or placeholder */}
      {pkg.goodsPhotoUrl ? (
        <img
          src={pkg.goodsPhotoUrl}
          alt={pkg.title}
          className="mb-4 h-36 w-full rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="mb-4 flex h-36 w-full items-center justify-center rounded-lg bg-brand-primary/5 border border-brand-muted/10">
          <div className="flex flex-col items-center gap-2 text-brand-primary/30">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10 fill-none stroke-current stroke-1"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="text-xs font-medium">{t("packages.noPhotoUploaded")}</span>
          </div>
        </div>
      )}

      {/* Title + weight */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 shrink-0 text-brand-accent" />
          <h3 className="font-semibold text-brand-primary">{pkg.title}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <PackageStatusBadge status={pkg.deliveryStatus} />
          <span className="flex items-center gap-1 rounded-full bg-brand-secondary/10 px-2 py-0.5 text-xs text-brand-secondary">
            <Weight className="h-3 w-3" />
            {pkg.weight} kg
          </span>
        </div>
      </div>

      {/* Route */}
      <div className="mt-3 flex items-center gap-2">
        <div className="text-center">
          <p className="text-xs text-brand-muted">{t("packages.fromLabel")}</p>
          <p className="text-sm font-medium text-brand-primary">
            {pkg.originCity}
          </p>
          <p className="text-xs text-brand-muted">{pkg.originCountry}</p>
        </div>
        <div className="flex-1 border-t-2 border-dashed border-brand-secondary/40 mx-2" />
        <MapPin className="h-4 w-4 shrink-0 text-brand-accent" />
        <div className="text-center">
          <p className="text-xs text-brand-muted">{t("packages.toLabel")}</p>
          <p className="text-sm font-medium text-brand-primary">
            {pkg.destCity}
          </p>
          <p className="text-xs text-brand-muted">{pkg.destCountry}</p>
        </div>
      </div>

      {pkg.notes && (
        <p className="mt-3 text-xs text-brand-muted">{pkg.notes}</p>
      )}

      {/* Sender */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={`https://api.dicebear.com/9.x/personas/svg?seed=${pkg.sender.id}&backgroundColor=e8edf5`}
            alt={pkg.sender.nickname}
            className="h-10 w-10 rounded-full border-2 border-brand-primary/10 object-cover"
            loading="lazy"
          />
          <div>
            <p className="text-xs text-brand-muted">{t("packages.senderLabel")}</p>
            <Link
              to={`/users/${pkg.sender.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-brand-primary hover:text-brand-accent"
            >
              {pkg.sender.legalFullName || pkg.sender.nickname}
            </Link>
            <p className="text-xs text-brand-muted">
              ⭐{" "}
              {pkg.sender.rating > 0
                ? pkg.sender.rating.toFixed(1)
                : "—"}
              {" · "}
              {t("packages.deliveredCount", { count: pkg.sender.packagesDeliveredCount })}
            </p>
          </div>
        </div>
        <p className="text-xs text-brand-muted">
          {new Date(pkg.createdAt).toLocaleDateString()}
        </p>
      </div>

      <ContactInfo pkg={pkg} canSeeContact={viewerCanSeeContact} />
    </div>
  );
}

// ── Main Packages page ────────────────────────────────────────

function Packages() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewerCanSeeContact, setViewerCanSeeContact] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    originCountry: "",
    destCountry: "",
    startDate: "",
    endDate: "",
  });

  const { register, handleSubmit } = useForm<SearchForm>();

  const fetchPackages = async (filters = activeFilters, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (filters.originCountry)
        params.set("originCountry", filters.originCountry);
      if (filters.destCountry) params.set("destCountry", filters.destCountry);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await api.get(`/packages?${params.toString()}`);
      setPackages(res.data.packages);
      setTotalPages(res.data.pagination.totalPages);
      setViewerCanSeeContact(Boolean(res.data.viewerCanSeeContact));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [page]);

  const onSearch = (data: SearchForm) => {
    const filters = {
      originCountry: data.originCountry,
      destCountry: data.destCountry,
      startDate: startDate ? startDate.toISOString() : "",
      endDate: endDate ? endDate.toISOString() : "",
    };
    setActiveFilters(filters);
    setPage(1);
    fetchPackages(filters, 1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SEO
        titleEn="Browse Packages — Find Items to Carry to Afghanistan and Worldwide"
        titleFa="مرور بسته‌ها — اقلامی برای حمل به افغانستان و سراسر جهان پیدا کنید"
        descriptionEn="Browse packages posted by verified Afghan senders. Carry packages to Afghanistan, Europe, USA, UAE, Iran, Turkey and earn from your upcoming trip. Join thousands of verified users."
        descriptionFa="بسته‌های ارسال شده توسط فرستندگان افغانی تأیید شده را مرور کنید. بسته‌ها را به افغانستان، اروپا، امریکا، امارات، ایران، ترکیه ببرید و از سفر بعدی خود درآمد کسب کنید."
        keywordsEn="packages to Afghanistan, carry package earn money, Afghan sender packages, package to Kabul, package to Herat, package to Afghanistan from Germany, package from USA to Afghanistan, package from UAE to Afghanistan, earn money carrying packages, Afghan traveler earn"
        keywordsFa="بسته‌ها به افغانستان، حمل بسته کسب درآمد، بسته‌های فرستنده افغانی، بسته به کابل، بسته به هرات، بسته به افغانستان از آلمان، بسته از امریکا به افغانستان، بسته از امارات به افغانستان، کسب درآمد از حمل بسته، مسافر افغانی کسب درآمد"
        path="/packages"
        structuredData={PACKAGES_STRUCTURED_DATA}
      />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">
            {t("packages.pageTitle")}
          </h1>
          <p className="text-sm text-brand-muted">
            {t("packages.pageSubtitle")}
          </p>
        </div>
        {user && (
          <div className="text-right">
            {user.accountStatus !== "APPROVED" ? (
              <span className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white opacity-50">
                <Plus className="h-4 w-4" />
                {t("packages.postPackage")}
              </span>
            ) : user.hasUnpaidCommission ? (
              <span
                title={t("packages.unpaidCommissionTooltip")}
                className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white opacity-50"
              >
                <Plus className="h-4 w-4" />
                {t("packages.postPackage")}
              </span>
            ) : (
              <Link
                to="/packages/new"
                className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                {t("packages.postPackage")}
              </Link>
            )}
            {user.accountStatus !== "APPROVED" && (
              <p className="mt-1 text-xs text-brand-muted">
                {t("packages.pendingApprovalNote")}
              </p>
            )}
          </div>
        )}
      </div>

      {user?.accountStatus === "APPROVED" && user.hasUnpaidCommission && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/5 px-4 py-3 text-sm text-brand-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t("packages.unpaidCommissionBanner")}
        </div>
      )}

      {/* Search form */}
      <form
        onSubmit={handleSubmit(onSearch)}
        className="mb-8 rounded-xl bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              {t("packages.fromCountry")}
            </label>
            <select
              {...register("originCountry")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
            >
              <option value="">{t("packages.anyCountry")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              {t("packages.toCountry")}
            </label>
            <select
              {...register("destCountry")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
            >
              <option value="">{t("packages.anyCountry")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              {t("packages.postedFrom")}
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              placeholderText={t("packages.startDatePlaceholder")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              {t("packages.postedTo")}
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              placeholderText={t("packages.endDatePlaceholder")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            {t("packages.searchPackages")}
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : packages.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-brand-muted">
            {t("packages.noResults")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              viewerCanSeeContact={viewerCanSeeContact}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-brand-muted/30 p-2 text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-brand-muted">
            {t("packages.page", { page, totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-brand-muted/30 p-2 text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bottom SEO text block */}
      <div className="mt-12 rounded-xl bg-white p-6 text-center shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-brand-primary">
          {t("packages.seoBottomHeading")}
        </h2>
        <p className="text-xs text-brand-muted leading-relaxed">
          {t("packages.seoBottomBody")}
        </p>
      </div>
    </div>
  );
}

export default Packages;
