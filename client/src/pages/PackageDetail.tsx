import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Package,
  MapPin,
  Weight,
  Loader2,
  Truck,
  Trash2,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { SEO } from "../components/SEO";

interface PackageData {
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
  recipientName?: string;
  recipientWhatsapp?: string;
  recipientEmail?: string;
  sender: {
    id: string;
    nickname: string;
    legalFullName?: string;
    whatsappNumber?: string;
    email?: string;
  };
  activeDelivery: {
    status: string;
    estimatedDeliveryDate: string | null;
    finalizedAt: string | null;
    traveler: { id: string; nickname: string };
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PROPOSED: { label: "Proposed", className: "bg-yellow-100 text-yellow-700" },
  ACCEPTED: { label: "In Transit", className: "bg-blue-100 text-blue-700" },
  FINALIZED: { label: "Delivered", className: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [viewerCanSeeContact, setViewerCanSeeContact] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/packages/${id}`)
      .then((res) => {
        setPkg(res.data.package);
        setViewerCanSeeContact(res.data.viewerCanSeeContact);
      })
      .catch(() => toast.error("Package not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (!pkg)
    return (
      <div className="py-16 text-center">
        <p className="text-brand-muted">Package not found.</p>
      </div>
    );

  const isSender = user?.id === pkg.sender.id;
  const canPropose =
    user?.accountStatus === "APPROVED" &&
    isSender &&
    (!pkg.activeDelivery || pkg.activeDelivery.status === "CANCELLED");
  const isFinalized = pkg.activeDelivery?.status === "FINALIZED";

  const handleDelete = async () => {
    if (!confirm("Delete this package?")) return;
    try {
      await api.delete(`/packages/${pkg.id}`);
      toast.success("Package deleted");
      navigate("/profile?tab=packages");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete package");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SEO
        titleEn={pkg.title}
        titleFa={pkg.title}
        descriptionEn={`Package from ${pkg.originCity}, ${pkg.originCountry} to ${pkg.destCity}, ${pkg.destCountry}. Connect with a traveler to carry it.`}
        descriptionFa={`بسته‌ای از ${pkg.originCity}, ${pkg.originCountry} به ${pkg.destCity}, ${pkg.destCountry}. برای حمل آن با یک مسافر ارتباط برقرار کنید.`}
        path={`/packages/${pkg.id}`}
      />
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-accent" />
            <h1 className="text-2xl font-bold text-brand-primary">
              {pkg.title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {pkg.activeDelivery && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_LABELS[pkg.activeDelivery.status]?.className ?? ""
                }`}
              >
                {STATUS_LABELS[pkg.activeDelivery.status]?.label ??
                  pkg.activeDelivery.status}
              </span>
            )}
            {isSender &&
              (isFinalized ? (
                <span
                  title="This package has been delivered and cannot be deleted."
                  className="text-brand-muted"
                >
                  <Lock className="h-4 w-4" />
                </span>
              ) : (
                <button
                  onClick={handleDelete}
                  className="text-brand-muted hover:text-brand-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ))}
          </div>
        </div>

        {pkg.goodsPhotoUrl ? (
          <img
            src={pkg.goodsPhotoUrl}
            alt={pkg.title}
            className="mt-6 h-64 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="mt-6 flex h-64 w-full items-center justify-center rounded-xl border border-brand-muted/10 bg-brand-primary/5">
            <div className="flex flex-col items-center gap-2 text-brand-primary/30">
              <Package className="h-12 w-12" />
              <span className="text-sm font-medium">No photo uploaded</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-brand-secondary/10 px-3 py-1 text-sm text-brand-secondary">
            <Weight className="h-4 w-4" />
            {pkg.weight} kg
          </span>
          <span className="text-xs text-brand-muted">
            Posted {new Date(pkg.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-brand-muted/10 bg-brand-bg p-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-brand-muted">From</p>
            <p className="font-semibold text-brand-primary">{pkg.originCity}</p>
            <p className="text-xs text-brand-muted">{pkg.originCountry}</p>
          </div>
          <MapPin className="h-4 w-4 shrink-0 text-brand-accent" />
          <div className="flex-1 text-center">
            <p className="text-xs text-brand-muted">To</p>
            <p className="font-semibold text-brand-primary">{pkg.destCity}</p>
            <p className="text-xs text-brand-muted">{pkg.destCountry}</p>
          </div>
        </div>

        {pkg.notes && (
          <p className="mt-4 text-sm text-brand-muted">{pkg.notes}</p>
        )}

        {/* Sender */}
        <div className="mt-6 border-t border-brand-muted/10 pt-6">
          <p className="mb-2 text-xs font-semibold uppercase text-brand-muted">
            Sender
          </p>
          <div className="flex items-center gap-3">
            <img
              src={`https://api.dicebear.com/9.x/personas/svg?seed=${pkg.sender.id}&backgroundColor=e8edf5`}
              alt={pkg.sender.nickname}
              className="h-10 w-10 rounded-full border-2 border-brand-primary/10 object-cover"
            />
            <Link
              to={`/users/${pkg.sender.id}`}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {pkg.sender.legalFullName || pkg.sender.nickname}
            </Link>
          </div>
          {viewerCanSeeContact ? (
            <div className="mt-3 space-y-1 text-sm">
              {pkg.sender.whatsappNumber && (
                <p className="text-brand-muted">
                  WhatsApp:{" "}
                  <span className="font-medium text-brand-primary">
                    {pkg.sender.whatsappNumber}
                  </span>
                </p>
              )}
              {pkg.sender.email && (
                <p className="text-brand-muted">
                  Email:{" "}
                  <span className="font-medium text-brand-primary">
                    {pkg.sender.email}
                  </span>
                </p>
              )}
              {pkg.recipientName && (
                <p className="mt-2 text-brand-muted">
                  Recipient:{" "}
                  <span className="font-medium text-brand-primary">
                    {pkg.recipientName}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs italic text-brand-muted">
              {!user ? (
                <>
                  <Link to="/register" className="text-brand-accent hover:underline">
                    Create an account and post a trip or package
                  </Link>{" "}
                  to see contact details
                </>
              ) : (
                "Post a trip or package to see contact details"
              )}
            </p>
          )}
        </div>

        {pkg.activeDelivery && (
          <div className="mt-6 rounded-xl border border-brand-muted/10 bg-brand-bg p-4 text-sm">
            <p className="text-brand-muted">
              Being carried by{" "}
              <span className="font-medium text-brand-primary">
                {pkg.activeDelivery.traveler.nickname}
              </span>
            </p>
            {pkg.activeDelivery.estimatedDeliveryDate && (
              <p className="mt-1 text-xs text-brand-muted">
                Est. delivery:{" "}
                {new Date(pkg.activeDelivery.estimatedDeliveryDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {canPropose && (
          <>
            <div className="mt-6 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Only propose a delivery after you've met the traveler in person
                and handed over the package. This notifies them immediately and
                cannot be undone.
              </p>
            </div>
            <Link
              to={`/packages/${pkg.id}/propose`}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Truck className="h-4 w-4" />
              Propose Delivery
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default PackageDetail;
