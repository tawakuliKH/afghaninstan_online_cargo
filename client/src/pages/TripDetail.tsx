import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Weight,
  Loader2,
  Package,
} from "lucide-react";
import { SEO } from "../components/SEO";

interface TripData {
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
  };
  activeDeliveries: {
    id: string;
    status: string;
    package: {
      id: string;
      title: string;
      destCity: string;
      destCountry: string;
    };
  }[];
}

function TripDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [viewerCanSeeContact, setViewerCanSeeContact] = useState(false);
  const [loading, setLoading] = useState(true);

  const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    PROPOSED: { label: t("tripDetail.statusProposed"), className: "bg-yellow-100 text-yellow-700" },
    ACCEPTED: { label: t("tripDetail.statusInTransit"), className: "bg-blue-100 text-blue-700" },
    FINALIZED: { label: t("tripDetail.statusDelivered"), className: "bg-green-100 text-green-700" },
  };

  useEffect(() => {
    setLoading(true);
    api
      .get(`/trips/${id}`)
      .then((res) => {
        setTrip(res.data.trip);
        setViewerCanSeeContact(res.data.viewerCanSeeContact);
      })
      .catch(() => toast.error(t("tripDetail.toastNotFound")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (!trip)
    return (
      <div className="py-16 text-center">
        <p className="text-brand-muted">{t("tripDetail.notFound")}</p>
      </div>
    );

  const isClosed = new Date(trip.departureDate) < new Date();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SEO
        titleEn={`${trip.originCity} to ${trip.destCity} Trip`}
        titleFa={`سفر از ${trip.originCity} به ${trip.destCity}`}
        descriptionEn={`Traveler heading from ${trip.originCity}, ${trip.originCountry} to ${trip.destCity}, ${trip.destCountry}. Connect to send a package on this trip.`}
        descriptionFa={`مسافری از ${trip.originCity}, ${trip.originCountry} به ${trip.destCity}, ${trip.destCountry} در حال سفر است. برای ارسال بسته در این سفر ارتباط برقرار کنید.`}
        path={`/trips/${trip.id}`}
      />
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("tripDetail.back")}
      </button>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-brand-primary">
            {trip.originCity} → {trip.destCity}
          </h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              isClosed
                ? "bg-brand-muted/10 text-brand-muted"
                : "bg-green-100 text-green-700"
            }`}
          >
            {isClosed ? t("tripDetail.tripClosedBadge") : t("tripDetail.activeBadge")}
          </span>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-brand-muted/10 bg-brand-bg p-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-brand-muted">{t("tripDetail.fromLabel")}</p>
            <p className="font-semibold text-brand-primary">{trip.originCity}</p>
            <p className="text-xs text-brand-muted">{trip.originCountry}</p>
          </div>
          <MapPin className="h-4 w-4 shrink-0 text-brand-accent" />
          <div className="flex-1 text-center">
            <p className="text-xs text-brand-muted">{t("tripDetail.toLabel")}</p>
            <p className="font-semibold text-brand-primary">{trip.destCity}</p>
            <p className="text-xs text-brand-muted">{trip.destCountry}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className="flex items-center gap-1 rounded-full bg-brand-primary/5 px-3 py-1 text-xs text-brand-primary">
            <Calendar className="h-3 w-3" />
            {t("tripDetail.departsOn", { date: new Date(trip.departureDate).toLocaleDateString() })}
          </span>
          {trip.capacityWeight && (
            <span className="flex items-center gap-1 rounded-full bg-brand-secondary/10 px-3 py-1 text-xs text-brand-secondary">
              <Weight className="h-3 w-3" />
              {t("tripDetail.capacityKg", { weight: trip.capacityWeight })}
            </span>
          )}
          {trip.capacityNote && (
            <span className="rounded-full bg-brand-muted/10 px-3 py-1 text-xs text-brand-muted">
              {trip.capacityNote}
            </span>
          )}
        </div>

        {trip.notes && (
          <p className="mt-4 text-sm text-brand-muted">{trip.notes}</p>
        )}

        {/* Traveler */}
        <div className="mt-6 border-t border-brand-muted/10 pt-6">
          <p className="mb-2 text-xs font-semibold uppercase text-brand-muted">
            {t("tripDetail.travelerLabel")}
          </p>
          <div className="flex items-center gap-3">
            <img
              src={`https://api.dicebear.com/9.x/notionists/svg?seed=${trip.traveler.id}&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear`}
              alt={trip.traveler.nickname}
              className="h-10 w-10 rounded-full border-2 border-brand-primary/10 object-cover"
            />
            <Link
              to={`/users/${trip.traveler.id}`}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {trip.traveler.legalFullName || trip.traveler.nickname}
            </Link>
          </div>
          {isClosed ? (
            <p className="mt-3 text-xs italic text-brand-muted">
              {t("tripDetail.tripClosedMessage")}
            </p>
          ) : viewerCanSeeContact ? (
            <div className="mt-3 space-y-1 text-sm">
              {trip.traveler.whatsappNumber && (
                <p className="text-brand-muted">
                  {t("contactInfo.whatsappLabel")}
                  <span className="font-medium text-brand-primary">
                    {trip.traveler.whatsappNumber}
                  </span>
                </p>
              )}
              {trip.traveler.email && (
                <p className="text-brand-muted">
                  {t("contactInfo.emailLabel")}
                  <span className="font-medium text-brand-primary">
                    {trip.traveler.email}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs italic text-brand-muted">
              {!user ? (
                <>
                  <Link to="/register" className="text-brand-accent hover:underline">
                    {t("contactInfo.anonPrefix")}
                  </Link>
                  {t("contactInfo.anonSuffix")}
                </>
              ) : (
                t("tripDetail.postToSeeContact")
              )}
            </p>
          )}
        </div>

        {trip.activeDeliveries.length > 0 && (
          <div className="mt-6 border-t border-brand-muted/10 pt-6">
            <p className="mb-2 text-xs font-semibold uppercase text-brand-muted">
              {t("tripDetail.packagesOnTrip")}
            </p>
            <div className="space-y-2">
              {trip.activeDeliveries.map((d) => (
                <Link
                  key={d.id}
                  to={`/packages/${d.package.id}`}
                  className="flex items-center justify-between rounded-lg border border-brand-muted/10 px-3 py-2 text-sm transition hover:bg-brand-bg"
                >
                  <span className="flex items-center gap-2 text-brand-primary">
                    <Package className="h-4 w-4 text-brand-accent" />
                    {d.package.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_LABELS[d.status]?.className ?? ""
                    }`}
                  >
                    {STATUS_LABELS[d.status]?.label ?? d.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripDetail;
