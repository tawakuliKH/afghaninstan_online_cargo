import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import toast from "react-hot-toast";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Package,
  Truck,
  MessageSquare,
  Bell,
  Calendar,
  Weight,
  Loader2,
  Trash2,
  Wallet,
  TrendingDown,
  TrendingUp,
  Pencil,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AgreementModal } from "../components/AgreementModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { SEO } from "../components/SEO";
import { WorkflowTimeline, type WorkflowDelivery } from "../components/WorkflowTimeline";
import { WorkflowDashboard } from "../components/WorkflowDashboard";

function getStatusConfig(t: TFunction) {
  return {
    PENDING: {
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      label: t("profile.status.pendingLabel"),
      message: t("profile.status.pendingMessage"),
    },
    APPROVED: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      label: t("profile.status.approvedLabel"),
      message: "",
    },
    REJECTED: {
      icon: XCircle,
      color: "text-brand-danger",
      bg: "bg-red-50",
      border: "border-red-200",
      label: t("profile.status.rejectedLabel"),
      message: t("profile.status.rejectedMessage"),
    },
    SUSPENDED: {
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      label: t("profile.status.suspendedLabel"),
      message: t("profile.status.suspendedMessage"),
    },
  };
}

function CollapsibleWorkflow({
  delivery,
  viewerId,
  onAccept,
  onFinalize,
}: {
  delivery: WorkflowDelivery;
  viewerId?: string;
  onAccept?: () => void;
  onFinalize?: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="font-medium text-brand-primary">{delivery.package.title}</p>
          <p className="text-xs text-brand-muted">
            {delivery.status === "FINALIZED"
              ? t("profile.workflow.delivered")
              : delivery.status === "CANCELLED"
              ? t("profile.workflow.cancelled")
              : t("profile.workflow.inProgress")}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-brand-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-brand-muted" />
        )}
      </button>
      {expanded && (
        <div className="mt-4 border-t border-brand-muted/10 pt-4">
          <WorkflowTimeline
            delivery={delivery}
            viewerId={viewerId}
            onAccept={onAccept}
            onFinalize={onFinalize}
          />
        </div>
      )}
    </div>
  );
}

function WorkflowSection({
  deliveries,
  viewerId,
  onAccept,
  onFinalize,
}: {
  deliveries: WorkflowDelivery[];
  viewerId?: string;
  onAccept?: (deliveryId: string) => void;
  onFinalize?: (deliveryId: string) => void;
}) {
  const { t } = useTranslation();
  if (deliveries.length === 0) return null;

  const active = deliveries.filter((d) => d.status !== "FINALIZED");
  const completed = deliveries.filter((d) => d.status === "FINALIZED");

  return (
    <div className="mb-6 space-y-4">
      {active.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {t("profile.workflow.activeHeading")}
          </h3>
          <div className="space-y-2">
            {active.map((d) => (
              <CollapsibleWorkflow
                key={d.id}
                delivery={d}
                viewerId={viewerId}
                onAccept={onAccept ? () => onAccept(d.id) : undefined}
                onFinalize={onFinalize ? () => onFinalize(d.id) : undefined}
              />
            ))}
          </div>
        </div>
      )}
      {completed.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
            {t("profile.workflow.completedHeading")}
          </h3>
          <div className="space-y-2">
            {completed.map((d) => (
              <CollapsibleWorkflow key={d.id} delivery={d} viewerId={viewerId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MyTrips() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get("/trips?page=1")
      .then((res) => {
        const { user } = useAuthStore.getState();
        setTrips(res.data.trips.filter((trip: any) => trip.travelerId === user?.id));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/trips/${deleteId}`);
      setTrips((prev) => prev.filter((tr) => tr.id !== deleteId));
      toast.success(t("profile.trips.toastDeleted"));
    } catch {
      toast.error(t("profile.trips.toastDeleteFailed"));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (trips.length === 0)
    return (
      <div className="py-10 text-center">
        <p className="text-brand-muted">{t("profile.trips.empty")}</p>
        <Link
          to="/trips/new"
          className="mt-3 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          {t("profile.trips.postTrip")}
        </Link>
      </div>
    );

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div
          key={trip.id}
          onClick={() => navigate(`/trips/${trip.id}`)}
          className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-accent" />
              <span className="font-medium text-brand-primary">
                {trip.originCity}, {trip.originCountry} → {trip.destCity},{" "}
                {trip.destCountry}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(trip.id);
              }}
              className="text-brand-muted hover:text-brand-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex gap-3">
            <span className="flex items-center gap-1 text-xs text-brand-muted">
              <Calendar className="h-3 w-3" />
              {new Date(trip.departureDate).toLocaleDateString()}
            </span>
            {trip.capacityNote && (
              <span className="text-xs text-brand-muted">
                {trip.capacityNote}
              </span>
            )}
          </div>
        </div>
      ))}
      <Link
        to="/trips/new"
        className="inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
      >
        {t("profile.trips.postAnotherTrip")}
      </Link>
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        variant="danger"
        title={t("profile.trips.deleteModalTitle")}
        message={t("profile.trips.deleteModalMessage")}
        confirmLabel={t("profile.trips.deleteLabel")}
        loading={deleting}
      />
    </div>
  );
}

function getPackageDeliveryBadges(t: TFunction): Record<string, { label: string; className: string }> {
  return {
    PROPOSED: { label: t("profile.packages.badgeProposed"), className: "bg-yellow-100 text-yellow-700" },
    ACCEPTED: { label: t("profile.packages.badgeAccepted"), className: "bg-blue-100 text-blue-700" },
    FINALIZED: { label: t("profile.packages.badgeFinalized"), className: "bg-green-100 text-green-700" },
  };
}

function MyPackages() {
  const { t } = useTranslation();
  const PACKAGE_DELIVERY_BADGES = getPackageDeliveryBadges(t);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [packages, setPackages] = useState<any[]>([]);
  const [deliveriesByPackage, setDeliveriesByPackage] = useState<
    Record<string, WorkflowDelivery>
  >({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/packages?page=1"),
      api.get("/deliveries/mine"),
    ])
      .then(([packagesRes, deliveriesRes]) => {
        const { user } = useAuthStore.getState();
        setPackages(
          packagesRes.data.packages.filter(
            (p: any) => p.senderId === user?.id
          )
        );
        // /deliveries/mine is ordered by createdAt desc, so the first entry
        // seen per package is that package's latest delivery. Only keep
        // deliveries for packages this user actually sent (not ones where
        // they're the traveler on someone else's package).
        const byPackage: Record<string, WorkflowDelivery> = {};
        for (const d of deliveriesRes.data.deliveries) {
          const packageId = d.package?.id ?? d.packageId;
          if (packageId && d.senderId === user?.id && !(packageId in byPackage)) {
            byPackage[packageId] = d;
          }
        }
        setDeliveriesByPackage(byPackage);
      })
      .finally(() => setLoading(false));
  }, []);

  const latestDeliveryStatus = Object.fromEntries(
    Object.entries(deliveriesByPackage).map(([id, d]) => [id, d.status])
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/packages/${deleteId}`);
      setPackages((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success(t("profile.packages.toastDeleted"));
    } catch {
      toast.error(t("profile.packages.toastDeleteFailed"));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (packages.length === 0)
    return (
      <div className="py-10 text-center">
        <p className="text-brand-muted">{t("profile.packages.empty")}</p>
        <Link
          to="/packages/new"
          className="mt-3 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          {t("profile.packages.postPackage")}
        </Link>
      </div>
    );

  const hasPendingPropose = packages.some((p) => !latestDeliveryStatus[p.id]);

  return (
    <div>
      <WorkflowSection deliveries={Object.values(deliveriesByPackage)} viewerId={user?.id} />

      {hasPendingPropose && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("profile.packages.pendingProposeBanner")}</p>
        </div>
      )}

      <div className="space-y-4">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          onClick={() => navigate(`/packages/${pkg.id}`)}
          className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-brand-accent" />
              <span className="font-medium text-brand-primary">
                {pkg.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const status = latestDeliveryStatus[pkg.id];
                const badge = status ? PACKAGE_DELIVERY_BADGES[status] : undefined;
                return badge ? (
                  <span
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${badge.className}`}
                  >
                    <Truck className="h-3 w-3" />
                    {badge.label}
                  </span>
                ) : (
                  <Link
                    to={`/packages/${pkg.id}/propose`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 rounded-lg bg-brand-accent/10 px-2 py-1 text-xs font-semibold text-brand-accent hover:bg-brand-accent/20 transition"
                  >
                    <Truck className="h-3 w-3" />
                    {t("profile.packages.proposeDelivery")}
                  </Link>
                );
              })()}
              {latestDeliveryStatus[pkg.id] === "FINALIZED" ? (
                <span
                  title={t("profile.packages.lockedTooltip")}
                  className="text-brand-muted"
                >
                  <Lock className="h-4 w-4" />
                </span>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(pkg.id);
                  }}
                  className="text-brand-muted hover:text-brand-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 flex gap-3">
            <span className="flex items-center gap-1 text-xs text-brand-muted">
              <Weight className="h-3 w-3" /> {pkg.weight} kg
            </span>
            <span className="flex items-center gap-1 text-xs text-brand-muted">
              <MapPin className="h-3 w-3" />
              {pkg.originCity} → {pkg.destCity}
            </span>
          </div>
        </div>
      ))}
      <Link
        to="/packages/new"
        className="inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
      >
        {t("profile.packages.postAnotherPackage")}
      </Link>
      </div>
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        variant="danger"
        title={t("profile.packages.deleteModalTitle")}
        message={t("profile.packages.deleteModalMessage")}
        confirmLabel={t("profile.packages.deleteLabel")}
        loading={deleting}
      />
    </div>
  );
}

function MyDeliveries() {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreementModal, setAgreementModal] = useState<{
    isOpen: boolean;
    type: "DELIVER_PACKAGE" | "ACCEPT_DELIVERY";
    deliveryId: string;
    role: "sender" | "traveler";
    onAccepted: () => void;
  } | null>(null);
  const [finalizeId, setFinalizeId] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { user } = useAuthStore();

  const fetchDeliveries = async () => {
    try {
      const res = await api.get("/deliveries/mine");
      setDeliveries(res.data.deliveries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleAccept = (deliveryId: string) => {
    setAgreementModal({
      isOpen: true,
      type: "ACCEPT_DELIVERY",
      deliveryId,
      role: "traveler",
      onAccepted: async () => {
        setAgreementModal(null);
        try {
          const estDate = new Date();
          estDate.setDate(estDate.getDate() + 14);
          await api.post(`/deliveries/${deliveryId}/accept`, {
            estimatedDeliveryDate: estDate.toISOString(),
          });
          toast.success(t("profile.deliveries.toastAccepted"));
          fetchDeliveries();
        } catch {
          toast.error(t("profile.deliveries.toastAcceptFailed"));
        }
      },
    });
  };

  const handleFinalize = async () => {
    if (!finalizeId) return;
    setFinalizing(true);
    try {
      await api.post(`/deliveries/${finalizeId}/finalize`);
      toast.success(t("profile.deliveries.toastFinalized"));
      fetchDeliveries();
    } catch {
      toast.error(t("profile.deliveries.toastFinalizeFailed"));
    } finally {
      setFinalizing(false);
      setFinalizeId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await api.post(`/deliveries/${cancelId}/cancel`);
      toast.success(t("profile.deliveries.toastCancelled"));
      fetchDeliveries();
    } catch {
      toast.error(t("profile.deliveries.toastCancelFailed"));
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  };

  const statusColors: Record<string, string> = {
    PROPOSED: "bg-yellow-100 text-yellow-700",
    ACCEPTED: "bg-blue-100 text-blue-700",
    FINALIZED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (deliveries.length === 0)
    return (
      <div className="py-10 text-center">
        <p className="text-brand-muted">{t("profile.deliveries.empty")}</p>
      </div>
    );

  return (
    <>
      {agreementModal !== null && (
        <AgreementModal
          isOpen={agreementModal.isOpen}
          onClose={() => setAgreementModal(null)}
          onAccepted={agreementModal.onAccepted}
          type={agreementModal.type}
          deliveryId={agreementModal.deliveryId}
          role={agreementModal.role}
        />
      )}

      <ConfirmModal
        isOpen={finalizeId !== null}
        onClose={() => setFinalizeId(null)}
        onConfirm={handleFinalize}
        variant="success"
        title={t("profile.deliveries.finalizeModalTitle")}
        message={t("profile.deliveries.finalizeModalMessage")}
        confirmLabel={t("profile.deliveries.finalizeLabel")}
        loading={finalizing}
      />

      <ConfirmModal
        isOpen={cancelId !== null}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        variant="danger"
        title={t("profile.deliveries.cancelModalTitle")}
        message={t("profile.deliveries.cancelModalMessage")}
        confirmLabel={t("profile.deliveries.cancelDeliveryLabel")}
        cancelLabel={t("profile.deliveries.keepIt")}
        loading={cancelling}
      />

      <WorkflowSection
        deliveries={deliveries}
        viewerId={user?.id}
        onAccept={handleAccept}
        onFinalize={setFinalizeId}
      />

      <div className="space-y-4">
        {deliveries.map((d) => {
          const isSender = d.senderId === user?.id;
          const isTraveler = d.travelerId === user?.id;

          return (
            <div key={d.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to={`/packages/${d.package?.id}`}
                    className="font-medium text-brand-primary hover:text-brand-accent"
                  >
                    {d.package?.title}
                  </Link>
                  <p className="text-xs text-brand-muted">
                    {d.package?.destCity}, {d.package?.destCountry}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[d.status]}`}
                >
                  {d.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-brand-muted">
                {isSender && (
                  <span>
                    {t("profile.deliveries.travelerLabel")}{" "}
                    <span className="font-medium text-brand-primary">
                      {d.traveler?.nickname}
                    </span>
                  </span>
                )}
                {isTraveler && (
                  <span>
                    {t("profile.deliveries.senderLabel")}{" "}
                    <span className="font-medium text-brand-primary">
                      {d.sender?.nickname}
                    </span>
                  </span>
                )}
                <span>
                  {d.agreedAmount} {d.currency}
                </span>
                <span>{d.paymentLocation}</span>
              </div>

              {d.estimatedDeliveryDate && (
                <p className="mt-1 text-xs text-brand-muted">
                  {t("profile.deliveries.estDelivery")}{" "}
                  {new Date(d.estimatedDeliveryDate).toLocaleDateString()}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {isTraveler && d.status === "PROPOSED" && (
                  <button
                    onClick={() => handleAccept(d.id)}
                    className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    {t("profile.deliveries.acceptDelivery")}
                  </button>
                )}
                {isTraveler && d.status === "ACCEPTED" && (
                  <button
                    onClick={() => setFinalizeId(d.id)}
                    className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    {t("profile.deliveries.finalizeDelivery")}
                  </button>
                )}
                {d.status === "PROPOSED" && (
                  <button
                    onClick={() => setCancelId(d.id)}
                    className="rounded-lg bg-brand-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    {t("profile.deliveries.cancel")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MyMessages() {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/messages/conversations")
      .then((res) => {
        setConversations(res.data.conversations);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (conversations.length === 0)
    return (
      <div className="py-10 text-center">
        <p className="text-brand-muted">{t("profile.messages.empty")}</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {conversations.map((c, i) => (
        <Link
          key={i}
          to={`/messages/${c.partner.id}`}
          className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <img
            src={`https://api.dicebear.com/9.x/personas/svg?seed=${c.partner.id}&backgroundColor=e8edf5`}
            alt={c.partner.nickname}
            className="h-10 w-10 rounded-full"
          />
          <div className="flex-1 overflow-hidden">
            <p className="font-medium text-brand-primary">
              {c.partner.nickname}
            </p>
            <p className="truncate text-xs text-brand-muted">
              {c.lastMessage.content}
            </p>
          </div>
          <p className="text-xs text-brand-muted">
            {new Date(c.lastMessage.createdAt).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}

function MyNotifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/notifications")
      .then((res) => {
        setNotifications(res.data.notifications);
      })
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
  };

  const handleClick = (n: any) => {
    if (!n.readAt) markRead(n.id);
    if (n.link) navigate(n.link);
  };

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (notifications.length === 0)
    return (
      <div className="py-10 text-center">
        <p className="text-brand-muted">{t("profile.notifications.empty")}</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => handleClick(n)}
          className={`cursor-pointer rounded-xl p-4 shadow-sm transition hover:shadow-md ${
            n.readAt
              ? "bg-white"
              : "bg-brand-accent/5 border border-brand-accent/20"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-medium ${
                n.readAt ? "text-brand-muted" : "text-brand-primary"
              }`}
            >
              {n.title}
            </p>
            {!n.readAt && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent mt-1.5" />
            )}
          </div>
          <p className="mt-1 text-xs text-brand-muted">{n.body}</p>
          <p className="mt-1 text-xs text-brand-muted/60">
            {new Date(n.createdAt).toLocaleDateString()}
          </p>
          {n.type === "DELIVERY_FINALIZED" && n.link && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-accent">
              {t("profile.notifications.leaveReview")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

interface WalletTransaction {
  id: string;
  packageTitle: string;
  agreedAmount: number;
  currency: string;
  commissionAmount: number;
  commissionPaid: boolean;
  finalizedAt: string | null;
  type: "earning" | "commission_owed";
}

interface WalletData {
  totalEarned: number;
  totalCommissionOwed: number;
  totalCommissionPaid: number;
  balance: number;
  transactions: WalletTransaction[];
}

function WalletCard() {
  const { t } = useTranslation();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me/wallet")
      .then((res) => setWallet(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-6 flex justify-center rounded-2xl bg-white p-6 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!wallet) return null;

  const earnings = wallet.transactions.filter((tx) => tx.type === "earning");

  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-brand-accent/10 p-2">
            <Wallet className="h-5 w-5 text-brand-accent" />
          </div>
          <h2 className="font-semibold text-brand-primary">{t("profile.wallet.title")}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-brand-muted">{t("profile.wallet.balance")}</p>
          <p className="text-xl font-bold text-brand-primary">
            {wallet.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {wallet.totalCommissionOwed > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/5 px-3 py-2 text-xs text-brand-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t("profile.wallet.unpaidCommission", { amount: wallet.totalCommissionOwed.toFixed(2) })}
        </div>
      )}

      {earnings.length === 0 ? (
        <p className="text-sm text-brand-muted">{t("profile.wallet.noEarnings")}</p>
      ) : (
        <div className="space-y-2">
          {wallet.transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b border-brand-muted/10 py-2 last:border-0"
            >
              <div className="flex items-center gap-2">
                {tx.type === "earning" ? (
                  <TrendingUp className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 shrink-0 text-brand-danger" />
                )}
                <div>
                  <p className="text-sm font-medium text-brand-primary">
                    {tx.packageTitle}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {tx.type === "earning"
                      ? tx.commissionPaid
                        ? t("profile.wallet.earningSettled")
                        : t("profile.wallet.earning")
                      : t("profile.wallet.commissionOwed")}
                    {tx.finalizedAt &&
                      ` · ${new Date(tx.finalizedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  tx.type === "earning"
                    ? "text-green-600"
                    : tx.commissionPaid
                    ? "text-brand-muted"
                    : "text-brand-danger"
                }`}
              >
                {tx.agreedAmount > 0 ? "+" : "-"}
                {Math.abs(tx.agreedAmount).toFixed(2)} {tx.currency}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Profile() {
  const { t } = useTranslation();
  const { user, avatarUrl } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "trips";

  const TABS = [
    { id: "trips", label: t("profile.tabs.trips"), icon: MapPin },
    { id: "packages", label: t("profile.tabs.packages"), icon: Package },
    { id: "deliveries", label: t("profile.tabs.deliveries"), icon: Truck },
    { id: "messages", label: t("profile.tabs.messages"), icon: MessageSquare },
    { id: "notifications", label: t("profile.tabs.notifications"), icon: Bell },
  ];

  useEffect(() => {
    if (activeTab === "deliveries") {
      const el = document.getElementById("deliveries-section");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  if (!user) return null;

  const statusConfig = getStatusConfig(t);
  const status = statusConfig[user.accountStatus as keyof typeof statusConfig];
  const StatusIcon = status?.icon;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <SEO
        titleEn="My Profile"
        titleFa="پروفایل من"
        descriptionEn="Manage your trips, packages, deliveries, messages, and notifications."
        descriptionFa="سفرها، بسته‌ها، تحویل‌ها، پیام‌ها و اعلان‌های خود را مدیریت کنید."
        path="/profile"
        noIndex
      />
      {user.accountStatus !== "APPROVED" && status && (
        <div
          className={`mb-6 rounded-xl border ${status.border} ${status.bg} p-5`}
        >
          <div className="flex items-start gap-3">
            <StatusIcon
              className={`mt-0.5 h-5 w-5 shrink-0 ${status.color}`}
            />
            <div>
              <p className={`font-semibold ${status.color}`}>
                {status.label} — {t("profile.status.siteNameSuffix")}
              </p>
              <p className="mt-1 text-sm text-brand-muted">{status.message}</p>
              {user.accountStatus === "PENDING" && !user.profileCompleted && (
                <p className="mt-2 text-sm">
                  <Link
                    to="/profile/complete"
                    className="font-medium text-brand-accent hover:underline"
                  >
                    {t("profile.status.completeToApprove")}
                  </Link>
                </p>
              )}
              {user.accountStatus === "PENDING" && user.profileCompleted && (
                <p className="mt-2 text-sm text-brand-muted">
                  {t("profile.status.underReviewNote")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                avatarUrl ||
                `https://api.dicebear.com/9.x/personas/svg?seed=${user.id}&backgroundColor=e8edf5`
              }
              alt={user.nickname}
              className="h-16 w-16 rounded-full border-2 border-brand-primary/10 object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-brand-primary">
                {user.nickname}
              </h1>
              {(user.firstName || user.lastName) && (
                <p className="text-xs text-brand-muted">
                  {user.firstName} {user.lastName}
                </p>
              )}
              <p className="text-sm text-brand-muted">{user.email}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.accountStatus === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : user.accountStatus === "PENDING"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {status?.label || user.accountStatus}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {user.accountStatus === "PENDING" && !user.profileCompleted && (
              <Link
                to="/profile/complete"
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                <span>{t("profile.page.completeProfileButton")}</span>
              </Link>
            )}
            {user.accountStatus === "PENDING" && user.profileCompleted && (
              <span className="rounded-full bg-brand-muted/10 px-3 py-1.5 text-xs font-medium text-brand-muted">
                {t("profile.page.underReviewBadge")}
              </span>
            )}
            <Link
              to="/profile/edit"
              className="flex items-center gap-2 rounded-lg border border-brand-muted/30 px-3 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-bg"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">{t("profile.page.editProfile")}</span>
            </Link>
          </div>
        </div>
      </div>

      {user.accountStatus === "APPROVED" ? (
        <>
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold text-brand-primary">
              {t("profile.page.activityDashboard")}
            </h2>
            <div className="mb-4 border-t border-brand-muted/10" />
            <WorkflowDashboard />
          </div>

          <WalletCard />

          <div className="mb-4">
            <h2 className="text-lg font-bold text-brand-primary">{t("profile.page.detailedView")}</h2>
            <p className="text-xs text-brand-muted">
              {t("profile.page.detailedViewSubtitle")}
            </p>
          </div>

          <div id="deliveries-section" className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? "bg-brand-primary text-white"
                      : "text-brand-muted hover:text-brand-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div>
            {activeTab === "trips" && <MyTrips />}
            {activeTab === "packages" && <MyPackages />}
            {activeTab === "deliveries" && <MyDeliveries />}
            {activeTab === "messages" && <MyMessages />}
            {activeTab === "notifications" && <MyNotifications />}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-brand-muted">
            {t("profile.page.notApprovedNote")}
          </p>
        </div>
      )}
    </div>
  );
}

export default Profile;