import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import {
  Search,
  MapPin,
  Calendar,
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

interface Trip {
  id: string;
  originCountry: string;
  originCity: string;
  destCountry: string;
  destCity: string;
  departureDate: string;
  capacityWeight?: number;
  capacityNote?: string;
  notes?: string;
  createdAt: string;
  traveler: {
    id: string;
    nickname: string;
    legalFullName?: string;
    whatsappNumber?: string;
    email?: string;
    rating: number;
    packagesDeliveredCount: number;
  };
}

interface SearchForm {
  originCountry: string;
  destCountry: string;
}

// ── Structured Data ─────────────────────────────────────────

const TRIPS_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Available Trips — Afghanistan Online Cargo",
  "alternateName": "سفرهای موجود — کارگو آنلاین افغانستان",
  "description": "Browse verified Afghan travelers available to carry packages cross-border. Find travelers going from Afghanistan to Europe, USA, UAE, Iran, Turkey and worldwide.",
  "url": "https://afghancargo.online/trips",
  "inLanguage": ["en", "fa"],
  "isPartOf": {
    "@type": "WebSite",
    "name": "Afghanistan Online Cargo",
    "url": "https://afghancargo.online"
  },
  "about": {
    "@type": "Service",
    "name": "Trip Listings for Cross-Border Package Delivery",
    "description": "Verified Afghan travelers post their upcoming trips so package senders can find and connect with them for cross-border delivery coordination."
  }
}

// ── Contact Info ─────────────────────────────────────────────

function ContactInfo({
  trip,
  canSeeContact,
  isClosed,
}: {
  trip: Trip;
  canSeeContact: boolean;
  isClosed?: boolean;
}) {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  if (isClosed) {
    return (
      <div className="mt-3 border-t border-brand-muted/10 pt-3">
        <p className="text-xs italic text-brand-muted">
          {t("trips.tripClosedFull")}
        </p>
      </div>
    );
  }

  if (canSeeContact && (trip.traveler.whatsappNumber || trip.traveler.email)) {
    return (
      <div className="mt-3 space-y-1 border-t border-brand-muted/10 pt-3">
        {trip.traveler.whatsappNumber && (
          <p className="text-xs text-brand-muted">
            {t("contactInfo.whatsappLabel")}
            <a
              href={`https://wa.me/${trip.traveler.whatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {trip.traveler.whatsappNumber}
            </a>
          </p>
        )}
        {trip.traveler.email && (
          <p className="text-xs text-brand-muted">
            {t("contactInfo.emailLabel")}
            <a
              href={`mailto:${trip.traveler.email}`}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {trip.traveler.email}
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
              to="/trips/new"
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

// ── Trip Card ─────────────────────────────────────────────────

function TripCard({
  trip,
  viewerCanSeeContact,
}: {
  trip: Trip;
  viewerCanSeeContact: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isClosed = new Date(trip.departureDate) < new Date();

  return (
    <div
      onClick={() => navigate(`/trips/${trip.id}`)}
      className={`cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md ${
        isClosed ? "opacity-60 grayscale-[30%]" : ""
      }`}
    >
      {/* Route */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="text-center">
            <p className="text-xs text-brand-muted">{t("trips.fromLabel")}</p>
            <p className="font-semibold text-brand-primary">{trip.originCity}</p>
            <p className="text-xs text-brand-muted">{trip.originCountry}</p>
          </div>
          <div className="flex-1 border-t-2 border-dashed border-brand-secondary/40 mx-2" />
          <MapPin className="h-4 w-4 shrink-0 text-brand-accent" />
          <div className="text-center">
            <p className="text-xs text-brand-muted">{t("trips.toLabel")}</p>
            <p className="font-semibold text-brand-primary">{trip.destCity}</p>
            <p className="text-xs text-brand-muted">{trip.destCountry}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isClosed
              ? "bg-brand-muted/10 text-brand-muted"
              : "bg-green-100 text-green-700"
          }`}
        >
          {isClosed ? t("trips.tripClosedBadge") : t("trips.activeBadge")}
        </span>
      </div>

      {/* Details */}
      <div className="mt-4 flex flex-wrap gap-3">
        <span className="flex items-center gap-1 rounded-full bg-brand-primary/5 px-3 py-1 text-xs text-brand-primary">
          <Calendar className="h-3 w-3" />
          {new Date(trip.departureDate).toLocaleDateString()}
        </span>
        {trip.capacityWeight && (
          <span className="flex items-center gap-1 rounded-full bg-brand-secondary/10 px-3 py-1 text-xs text-brand-secondary">
            <Weight className="h-3 w-3" />
            {trip.capacityWeight} kg
          </span>
        )}
        {trip.capacityNote && (
          <span className="rounded-full bg-brand-muted/10 px-3 py-1 text-xs text-brand-muted">
            {trip.capacityNote}
          </span>
        )}
      </div>

      {trip.notes && (
        <p className="mt-3 text-xs text-brand-muted">{trip.notes}</p>
      )}

      {/* Traveler */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={`https://api.dicebear.com/9.x/personas/svg?seed=${trip.traveler.id}&backgroundColor=e8edf5`}
            alt={trip.traveler.nickname}
            className="h-10 w-10 rounded-full border-2 border-brand-primary/10 object-cover"
            loading="lazy"
          />
          <div>
            <p className="text-xs text-brand-muted">{t("trips.travelerLabel")}</p>
            <Link
              to={`/users/${trip.traveler.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-brand-primary hover:text-brand-accent"
            >
              {trip.traveler.legalFullName || trip.traveler.nickname}
            </Link>
            <p className="text-xs text-brand-muted">
              ⭐{" "}
              {trip.traveler.rating > 0
                ? trip.traveler.rating.toFixed(1)
                : "—"}
              {" · "}
              {t("trips.deliveredCount", { count: trip.traveler.packagesDeliveredCount })}
            </p>
          </div>
        </div>
      </div>

      <ContactInfo
        trip={trip}
        canSeeContact={viewerCanSeeContact}
        isClosed={isClosed}
      />
    </div>
  );
}

// ── Main Trips page ───────────────────────────────────────────

function Trips() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [trips, setTrips] = useState<Trip[]>([]);
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

  const fetchTrips = async (filters = activeFilters, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (filters.originCountry)
        params.set("originCountry", filters.originCountry);
      if (filters.destCountry) params.set("destCountry", filters.destCountry);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await api.get(`/trips?${params.toString()}`);
      setTrips(res.data.trips);
      setTotalPages(res.data.pagination.totalPages);
      setViewerCanSeeContact(Boolean(res.data.viewerCanSeeContact));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
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
    fetchTrips(filters, 1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SEO
        titleEn="Browse Afghan Travelers — Find Someone to Carry Your Package"
        titleFa="مرور مسافران افغانستان — کسی را برای حمل بسته خود پیدا کنید"
        descriptionEn="Browse verified Afghan travelers heading to Afghanistan, Europe, USA, UAE, Iran, Turkey and worldwide. Find someone to carry your package safely across borders."
        descriptionFa="مسافران تأیید شده افغانی که به افغانستان، اروپا، امریکا، امارات، ایران، ترکیه و سراسر جهان می‌روند را مرور کنید. کسی را برای حمل بسته شما به صورت امن از مرزها پیدا کنید."
        keywordsEn="Afghan travelers, find traveler, carry package Afghanistan, Afghan courier trips, traveler to Kabul, traveler to Afghanistan from Germany, traveler to Afghanistan from USA, traveler to Afghanistan from UAE, مسافر به افغانستان"
        keywordsFa="مسافران افغان، پیدا کردن مسافر، حمل بسته افغانستان، سفرهای پیک افغانی، مسافر به کابل، مسافر به افغانستان از آلمان، مسافر به افغانستان از امریکا، مسافر به افغانستان از امارات"
        path="/trips"
        structuredData={TRIPS_STRUCTURED_DATA}
      />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">
            {t("trips.pageTitle")}
          </h1>
          <p className="text-sm text-brand-muted">
            {t("trips.pageSubtitle")}
          </p>
        </div>
        {user && (
          <div className="text-right">
            {user.accountStatus !== "APPROVED" ? (
              <span className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white opacity-50">
                <Plus className="h-4 w-4" />
                {t("trips.postTrip")}
              </span>
            ) : user.hasUnpaidCommission ? (
              <span
                title={t("trips.unpaidCommissionTooltip")}
                className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white opacity-50"
              >
                <Plus className="h-4 w-4" />
                {t("trips.postTrip")}
              </span>
            ) : (
              <Link
                to="/trips/new"
                className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                {t("trips.postTrip")}
              </Link>
            )}
            {user.accountStatus !== "APPROVED" && (
              <p className="mt-1 text-xs text-brand-muted">
                {t("trips.pendingApprovalNote")}
              </p>
            )}
          </div>
        )}
      </div>

      {user?.accountStatus === "APPROVED" && user.hasUnpaidCommission && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/5 px-4 py-3 text-sm text-brand-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t("trips.unpaidCommissionBanner")}
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
              {t("trips.fromCountry")}
            </label>
            <select
              {...register("originCountry")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
            >
              <option value="">{t("trips.anyCountry")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              {t("trips.toCountry")}
            </label>
            <select
              {...register("destCountry")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
            >
              <option value="">{t("trips.anyCountry")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              {t("trips.departureFrom")}
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              placeholderText={t("trips.startDatePlaceholder")}
              className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-3 py-2 text-sm text-brand-primary outline-none focus:border-brand-primary"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-muted">
              {t("trips.departureTo")}
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              placeholderText={t("trips.endDatePlaceholder")}
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
            {t("trips.searchTrips")}
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : trips.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-brand-muted">
            {t("trips.noResults")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
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
            {t("trips.page", { page, totalPages })}
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

      {/* Bottom SEO text — keyword rich, helps Google understand the page */}
      <div className="mt-12 rounded-xl bg-white p-6 text-center shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-brand-primary">
          {t("trips.seoBottomHeading")}
        </h2>
        <p className="text-xs text-brand-muted leading-relaxed">
          {t("trips.seoBottomBody")}
        </p>
      </div>
    </div>
  );
}

export default Trips;
