import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { AgreementModal } from "../components/AgreementModal";

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    label: "Pending Review",
    message:
      "Your account is currently under review. An administrator will approve or reject your registration shortly.",
  },
  APPROVED: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "Approved",
    message: "",
  },
  REJECTED: {
    icon: XCircle,
    color: "text-brand-danger",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Rejected",
    message: "Your registration was rejected. Please contact support.",
  },
  SUSPENDED: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "Suspended",
    message: "Your account has been suspended. Please contact support.",
  },
};

function MyTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/trips?page=1")
      .then((res) => {
        const { user } = useAuthStore.getState();
        setTrips(res.data.trips.filter((t: any) => t.travelerId === user?.id));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trip?")) return;
    try {
      await api.delete(`/trips/${id}`);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trip deleted");
    } catch {
      toast.error("Failed to delete trip");
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
        <p className="text-brand-muted">You haven't posted any trips yet.</p>
        <Link
          to="/trips/new"
          className="mt-3 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Post a trip
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
                handleDelete(trip.id);
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
        + Post another trip
      </Link>
    </div>
  );
}

function MyPackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [proposedPackageIds, setProposedPackageIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

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
        const activeIds = deliveriesRes.data.deliveries
          .filter((d: any) => d.status === "PROPOSED" || d.status === "ACCEPTED")
          .map((d: any) => d.package?.id ?? d.packageId);
        setProposedPackageIds(new Set(activeIds));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    try {
      await api.delete(`/packages/${id}`);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      toast.success("Package deleted");
    } catch {
      toast.error("Failed to delete package");
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
        <p className="text-brand-muted">You haven't posted any packages yet.</p>
        <Link
          to="/packages/new"
          className="mt-3 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Post a package
        </Link>
      </div>
    );

  return (
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
              {proposedPackageIds.has(pkg.id) ? (
                <span className="flex items-center gap-1 rounded-lg bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                  <Truck className="h-3 w-3" />
                  Proposed
                </span>
              ) : (
                <Link
                  to={`/packages/${pkg.id}/propose`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 rounded-lg bg-brand-accent/10 px-2 py-1 text-xs font-semibold text-brand-accent hover:bg-brand-accent/20 transition"
                >
                  <Truck className="h-3 w-3" />
                  Propose Delivery
                </Link>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(pkg.id);
                }}
                className="text-brand-muted hover:text-brand-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
        + Post another package
      </Link>
    </div>
  );
}

function MyDeliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreementModal, setAgreementModal] = useState<{
    isOpen: boolean;
    type: "DELIVER_PACKAGE" | "ACCEPT_DELIVERY";
    deliveryId: string;
    role: "sender" | "traveler";
    onAccepted: () => void;
  } | null>(null);
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
          toast.success("Delivery accepted");
          fetchDeliveries();
        } catch {
          toast.error("Failed to accept delivery");
        }
      },
    });
  };

  const handleFinalize = async (deliveryId: string) => {
    if (!confirm("Confirm final delivery to recipient?")) return;
    try {
      await api.post(`/deliveries/${deliveryId}/finalize`);
      toast.success("Delivery finalized — commission recorded");
      fetchDeliveries();
    } catch {
      toast.error("Failed to finalize delivery");
    }
  };

  const handleCancel = async (deliveryId: string) => {
    if (!confirm("Cancel this delivery?")) return;
    try {
      await api.post(`/deliveries/${deliveryId}/cancel`);
      toast.success("Delivery cancelled");
      fetchDeliveries();
    } catch {
      toast.error("Failed to cancel delivery");
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
        <p className="text-brand-muted">No deliveries yet.</p>
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
                    Traveler:{" "}
                    <span className="font-medium text-brand-primary">
                      {d.traveler?.nickname}
                    </span>
                  </span>
                )}
                {isTraveler && (
                  <span>
                    Sender:{" "}
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
                  Est. delivery:{" "}
                  {new Date(d.estimatedDeliveryDate).toLocaleDateString()}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {isTraveler && d.status === "PROPOSED" && (
                  <button
                    onClick={() => handleAccept(d.id)}
                    className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Accept Delivery
                  </button>
                )}
                {isTraveler && d.status === "ACCEPTED" && (
                  <button
                    onClick={() => handleFinalize(d.id)}
                    className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Finalize Delivery
                  </button>
                )}
                {d.status === "PROPOSED" && (
                  <button
                    onClick={() => handleCancel(d.id)}
                    className="rounded-lg bg-brand-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    Cancel
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
        <p className="text-brand-muted">No messages yet.</p>
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

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (notifications.length === 0)
    return (
      <div className="py-10 text-center">
        <p className="text-brand-muted">No notifications yet.</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => !n.readAt && markRead(n.id)}
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

  const earnings = wallet.transactions.filter((t) => t.type === "earning");

  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-brand-accent/10 p-2">
            <Wallet className="h-5 w-5 text-brand-accent" />
          </div>
          <h2 className="font-semibold text-brand-primary">Wallet</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-brand-muted">Balance</p>
          <p className="text-xl font-bold text-brand-primary">
            {wallet.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {wallet.totalCommissionOwed > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-danger/30 bg-brand-danger/5 px-3 py-2 text-xs text-brand-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          You have {wallet.totalCommissionOwed.toFixed(2)} in unpaid commission.
        </div>
      )}

      {earnings.length === 0 ? (
        <p className="text-sm text-brand-muted">No earnings yet.</p>
      ) : (
        <div className="space-y-2">
          {wallet.transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between border-b border-brand-muted/10 py-2 last:border-0"
            >
              <div className="flex items-center gap-2">
                {t.type === "earning" ? (
                  <TrendingUp className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 shrink-0 text-brand-danger" />
                )}
                <div>
                  <p className="text-sm font-medium text-brand-primary">
                    {t.packageTitle}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {t.type === "earning"
                      ? t.commissionPaid
                        ? "Delivery earning · commission settled"
                        : "Delivery earning"
                      : "Commission owed"}
                    {t.finalizedAt &&
                      ` · ${new Date(t.finalizedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  t.type === "earning"
                    ? "text-green-600"
                    : t.commissionPaid
                    ? "text-brand-muted"
                    : "text-brand-danger"
                }`}
              >
                {t.agreedAmount > 0 ? "+" : "-"}
                {Math.abs(t.agreedAmount).toFixed(2)} {t.currency}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "trips", label: "My Trips", icon: MapPin },
  { id: "packages", label: "My Packages", icon: Package },
  { id: "deliveries", label: "Deliveries", icon: Truck },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function Profile() {
  const { user, avatarUrl } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "trips";

  if (!user) return null;

  const status = statusConfig[user.accountStatus as keyof typeof statusConfig];
  const StatusIcon = status?.icon;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
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
                {status.label} — Afghanistan Online Cargo
              </p>
              <p className="mt-1 text-sm text-brand-muted">{status.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
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
      </div>

      {user.accountStatus === "APPROVED" ? (
        <>
          <WalletCard />

          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
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
            Your profile tabs will be available once your account is approved.
          </p>
        </div>
      )}
    </div>
  );
}

export default Profile;