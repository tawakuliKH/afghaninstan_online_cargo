import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Loader2,
  Package,
  MapPin,
  Weight,
  Star,
  ArrowRightLeft,
  DollarSign,
} from "lucide-react";
import { WorkflowProgressBar } from "../components/WorkflowProgressBar";
import { AgreementModal } from "../components/AgreementModal";

interface PartyUser {
  id: string;
  nickname: string;
  legalFullName?: string;
  rating?: number;
  packagesDeliveredCount?: number;
}

interface DeliveryData {
  id: string;
  status: "PROPOSED" | "ACCEPTED" | "FINALIZED" | "CANCELLED";
  senderId: string;
  travelerId: string;
  agreedAmount: number;
  currency: string;
  paymentLocation: string;
  estimatedDeliveryDate: string | null;
  finalizedAt: string | null;
  commissionAmount?: number | null;
  commissionPaid?: boolean;
  package: {
    id: string;
    title: string;
    weight: number;
    originCity: string;
    originCountry: string;
    destCity: string;
    destCountry: string;
    notes?: string;
    goodsPhotoUrl?: string;
  };
  sender: PartyUser;
  traveler: PartyUser;
  review: { id: string; rating: number; comment: string | null; createdAt: string } | null;
}

function Avatar({ userId, nickname }: { userId: string; nickname: string }) {
  return (
    <img
      src={`https://api.dicebear.com/9.x/personas/svg?seed=${userId}&backgroundColor=e8edf5`}
      alt={nickname}
      className="h-14 w-14 rounded-full border-2 border-brand-primary/10 object-cover"
    />
  );
}

function ReadOnlyStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-brand-accent text-brand-accent" : "text-brand-muted/30"}`}
        />
      ))}
    </div>
  );
}

function DeliveryDetail() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreementModal, setAgreementModal] = useState<{
    isOpen: boolean;
    type: "DELIVER_PACKAGE" | "ACCEPT_DELIVERY";
    role: "sender" | "traveler";
    onAccepted: () => void;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDelivery = () => {
    setLoading(true);
    api
      .get(`/deliveries/${deliveryId}`)
      .then((res) => setDelivery(res.data.delivery))
      .catch(() => toast.error("Failed to load delivery"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDelivery();
  }, [deliveryId]);

  if (loading)
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (!delivery)
    return (
      <div className="py-16 text-center">
        <p className="text-brand-muted">Delivery not found.</p>
      </div>
    );

  const isSender = user?.id === delivery.senderId;
  const isTraveler = user?.id === delivery.travelerId;
  const canSeeCommission = isTraveler || user?.isAdmin;

  const handleAccept = () => {
    setAgreementModal({
      isOpen: true,
      type: "ACCEPT_DELIVERY",
      role: "traveler",
      onAccepted: async () => {
        setAgreementModal(null);
        setActionLoading(true);
        try {
          const estDate = new Date();
          estDate.setDate(estDate.getDate() + 14);
          await api.post(`/deliveries/${deliveryId}/accept`, {
            estimatedDeliveryDate: estDate.toISOString(),
          });
          toast.success("Delivery accepted");
          fetchDelivery();
        } catch {
          toast.error("Failed to accept delivery");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleFinalize = async () => {
    if (!confirm("Confirm final delivery to recipient?")) return;
    setActionLoading(true);
    try {
      await api.post(`/deliveries/${deliveryId}/finalize`);
      toast.success("Delivery finalized — commission recorded");
      fetchDelivery();
    } catch {
      toast.error("Failed to finalize delivery");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this delivery?")) return;
    setActionLoading(true);
    try {
      await api.post(`/deliveries/${deliveryId}/cancel`);
      toast.success("Delivery cancelled");
      fetchDelivery();
    } catch {
      toast.error("Failed to cancel delivery");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {agreementModal && (
        <AgreementModal
          isOpen={agreementModal.isOpen}
          onClose={() => setAgreementModal(null)}
          onAccepted={agreementModal.onAccepted}
          type={agreementModal.type}
          deliveryId={deliveryId!}
          role={agreementModal.role}
        />
      )}

      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Workflow progress */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <WorkflowProgressBar delivery={{ status: delivery.status, hasReview: Boolean(delivery.review) }} />
      </div>

      {/* Package details */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Package
        </h2>
        <div className="flex gap-4">
          {delivery.package.goodsPhotoUrl ? (
            <img
              src={delivery.package.goodsPhotoUrl}
              alt={delivery.package.title}
              className="h-24 w-24 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-brand-primary/5">
              <Package className="h-8 w-8 text-brand-primary/30" />
            </div>
          )}
          <div className="flex-1">
            <Link
              to={`/packages/${delivery.package.id}`}
              className="font-bold text-brand-primary hover:text-brand-accent"
            >
              {delivery.package.title}
            </Link>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-muted">
              <span className="flex items-center gap-1">
                <Weight className="h-3 w-3" /> {delivery.package.weight} kg
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {delivery.package.originCity}, {delivery.package.originCountry}
                {" → "}
                {delivery.package.destCity}, {delivery.package.destCountry}
              </span>
            </div>
            {delivery.package.notes && (
              <p className="mt-2 text-xs text-brand-muted">{delivery.package.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Parties
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center text-center">
            <Avatar userId={delivery.sender.id} nickname={delivery.sender.nickname} />
            <p className="mt-2 text-xs text-brand-muted">Sender</p>
            <Link
              to={`/users/${delivery.sender.id}`}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {delivery.sender.legalFullName || delivery.sender.nickname}
            </Link>
          </div>
          <ArrowRightLeft className="h-5 w-5 shrink-0 text-brand-accent" />
          <div className="flex flex-1 flex-col items-center text-center">
            <Avatar userId={delivery.traveler.id} nickname={delivery.traveler.nickname} />
            <p className="mt-2 text-xs text-brand-muted">Traveler</p>
            <Link
              to={`/users/${delivery.traveler.id}`}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {delivery.traveler.legalFullName || delivery.traveler.nickname}
            </Link>
            {delivery.traveler.rating !== undefined && (
              <p className="mt-0.5 text-xs text-brand-muted">
                ⭐ {delivery.traveler.rating > 0 ? delivery.traveler.rating.toFixed(1) : "—"} ·{" "}
                {delivery.traveler.packagesDeliveredCount ?? 0} delivered
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Terms
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-brand-muted">Agreed amount</p>
            <p className="font-semibold text-brand-primary">
              {delivery.agreedAmount} {delivery.currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">Payment location</p>
            <p className="font-semibold text-brand-primary">{delivery.paymentLocation}</p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">Estimated delivery</p>
            <p className="font-semibold text-brand-primary">
              {delivery.estimatedDeliveryDate
                ? new Date(delivery.estimatedDeliveryDate).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-muted">Finalized</p>
            <p className="font-semibold text-brand-primary">
              {delivery.finalizedAt ? new Date(delivery.finalizedAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Commission — traveler/admin only */}
      {canSeeCommission && delivery.commissionAmount != null && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
            <DollarSign className="h-3.5 w-3.5" /> Commission
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-brand-primary">
              {delivery.commissionAmount} {delivery.currency}
            </p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                delivery.commissionPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-brand-danger"
              }`}
            >
              {delivery.commissionPaid ? "Paid" : "Unpaid"}
            </span>
          </div>
        </div>
      )}

      {/* Review */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Review
        </h2>
        {delivery.review ? (
          <div>
            <ReadOnlyStars rating={delivery.review.rating} />
            {delivery.review.comment && (
              <p className="mt-3 text-sm text-brand-muted">{delivery.review.comment}</p>
            )}
            <p className="mt-2 text-xs text-brand-muted/60">
              {delivery.sender.nickname} · {new Date(delivery.review.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : isSender && delivery.status === "FINALIZED" ? (
          <Link
            to={`/deliveries/${delivery.id}/review`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Star className="h-4 w-4" /> Leave a Review
          </Link>
        ) : (
          <p className="text-sm text-brand-muted">No review yet.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isTraveler && delivery.status === "PROPOSED" && (
          <button
            onClick={handleAccept}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Accept Delivery
          </button>
        )}
        {isTraveler && delivery.status === "ACCEPTED" && (
          <button
            onClick={handleFinalize}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Finalize Delivery
          </button>
        )}
        {(isSender || isTraveler) && delivery.status === "PROPOSED" && (
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-lg bg-brand-danger px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default DeliveryDetail;
