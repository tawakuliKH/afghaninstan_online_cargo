import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios";
import { WorkflowProgressBar } from "./WorkflowProgressBar";
import {
  CheckCircle,
  Truck,
  Star,
  DollarSign,
  Package,
  MapPin,
  ChevronDown,
  ChevronUp,
  Weight,
  RefreshCw,
} from "lucide-react";

// ── Types matching GET /api/auth/me/dashboard ───────────────

type DeliveryStatus = "PROPOSED" | "ACCEPTED" | "FINALIZED" | "CANCELLED";

interface DeliverySummary {
  id: string;
  status: DeliveryStatus;
  agreedAmount: number;
  currency: string;
  paymentLocation: string;
  estimatedDeliveryDate: string | null;
  finalizedAt: string | null;
  commissionAmount: number | null;
  commissionPaid: boolean;
  traveler: { id: string; nickname: string; rating: number; packagesDeliveredCount: number };
  hasReview: boolean;
}

interface MyPackageItem {
  id: string;
  title: string;
  weight: number;
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  createdAt: string;
  goodsPhotoUrl?: string;
  delivery: DeliverySummary | null;
}

interface MyDeliveryItem {
  id: string;
  status: DeliveryStatus;
  agreedAmount: number;
  currency: string;
  paymentLocation: string;
  estimatedDeliveryDate: string | null;
  finalizedAt: string | null;
  commissionAmount: number | null;
  commissionPaid: boolean;
  package: { id: string; title: string; destCity: string; destCountry: string; goodsPhotoUrl?: string };
  sender: { id: string; nickname: string };
  hasReview: boolean;
}

interface MyTripItem {
  id: string;
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  departureDate: string;
  capacityNote?: string;
  capacityWeight?: number;
  createdAt: string;
}

interface PendingAction {
  type: string;
  priority: "urgent" | "normal";
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  relatedId: string | null;
}

interface DashboardData {
  user: {
    id: string;
    nickname: string;
    accountStatus: string;
    isAdmin: boolean;
    hasPosted: boolean;
    hasUnpaidCommission: boolean;
  };
  myPackages: MyPackageItem[];
  myDeliveries: MyDeliveryItem[];
  myTrips: MyTripItem[];
  pendingActions: PendingAction[];
}

// ── Unified active/completed workflow item (sender or traveler view) ────

interface WorkflowItem {
  deliveryId: string;
  status: DeliveryStatus;
  packageId: string;
  packageTitle: string;
  destCity: string;
  destCountry: string;
  agreedAmount: number;
  currency: string;
  finalizedAt: string | null;
  commissionAmount: number | null;
  commissionPaid: boolean;
  hasReview: boolean;
  viewerRole: "sender" | "traveler";
  counterpart: { id: string; nickname: string };
}

function buildWorkflowItems(data: DashboardData): WorkflowItem[] {
  const fromPackages: WorkflowItem[] = data.myPackages
    .filter((p) => p.delivery)
    .map((p) => ({
      deliveryId: p.delivery!.id,
      status: p.delivery!.status,
      packageId: p.id,
      packageTitle: p.title,
      destCity: p.destCity,
      destCountry: p.destCountry,
      agreedAmount: p.delivery!.agreedAmount,
      currency: p.delivery!.currency,
      finalizedAt: p.delivery!.finalizedAt,
      commissionAmount: p.delivery!.commissionAmount,
      commissionPaid: p.delivery!.commissionPaid,
      hasReview: p.delivery!.hasReview,
      viewerRole: "sender" as const,
      counterpart: { id: p.delivery!.traveler.id, nickname: p.delivery!.traveler.nickname },
    }));

  const fromDeliveries: WorkflowItem[] = data.myDeliveries.map((d) => ({
    deliveryId: d.id,
    status: d.status,
    packageId: d.package.id,
    packageTitle: d.package.title,
    destCity: d.package.destCity,
    destCountry: d.package.destCountry,
    agreedAmount: d.agreedAmount,
    currency: d.currency,
    finalizedAt: d.finalizedAt,
    commissionAmount: d.commissionAmount,
    commissionPaid: d.commissionPaid,
    hasReview: d.hasReview,
    viewerRole: "traveler" as const,
    counterpart: { id: d.sender.id, nickname: d.sender.nickname },
  }));

  return [...fromPackages, ...fromDeliveries];
}

// ── Small presentational pieces ─────────────────────────────

const ACTION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  ACCEPT_DELIVERY: { icon: CheckCircle, color: "text-brand-secondary" },
  FINALIZE_DELIVERY: { icon: Truck, color: "text-brand-secondary" },
  LEAVE_REVIEW: { icon: Star, color: "text-brand-accent" },
  PAY_COMMISSION: { icon: DollarSign, color: "text-brand-danger" },
  PROPOSE_DELIVERY: { icon: Package, color: "text-brand-accent" },
  POST_FIRST_TRIP: { icon: MapPin, color: "text-brand-primary" },
};

function ActionCard({ action }: { action: PendingAction }) {
  const isUrgent = action.priority === "urgent";
  const { icon: Icon, color } = ACTION_ICONS[action.type] ?? { icon: Package, color: "text-brand-accent" };

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border-l-4 p-4 shadow-sm ${
        isUrgent ? "border-brand-danger bg-red-50" : "border-brand-accent bg-brand-accent/5"
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-base font-bold text-brand-primary">{action.title}</p>
        <p className="mt-0.5 text-sm text-brand-muted">{action.description}</p>
        {action.type === "PROPOSE_DELIVERY" && (
          <p className="mt-1.5 flex items-start gap-1.5 rounded-md border border-yellow-200 bg-yellow-50 px-2.5 py-1.5 text-xs text-yellow-700">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            Only propose after meeting the traveler in person and handing over the package.
          </p>
        )}
        <Link
          to={action.actionUrl}
          className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 ${
            isUrgent ? "bg-brand-danger" : "bg-brand-accent"
          }`}
        >
          {action.actionLabel}
        </Link>
      </div>
    </div>
  );
}

function workflowCTA(item: WorkflowItem) {
  if (item.status === "PROPOSED" && item.viewerRole === "traveler") {
    return { label: "Review & Accept", url: "/profile?tab=deliveries" };
  }
  if (item.status === "ACCEPTED" && item.viewerRole === "traveler") {
    return { label: "Finalize Delivery", url: "/profile?tab=deliveries" };
  }
  if (item.status === "FINALIZED" && !item.hasReview && item.viewerRole === "sender") {
    return { label: "Leave Review →", url: `/deliveries/${item.deliveryId}/review` };
  }
  return null;
}

function ActiveWorkflowCard({ item }: { item: WorkflowItem }) {
  const cta = workflowCTA(item);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <WorkflowProgressBar delivery={{ status: item.status, hasReview: item.hasReview }} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-muted/10 pt-4">
        <div>
          <Link
            to={`/packages/${item.packageId}`}
            className="font-bold text-brand-primary hover:text-brand-accent"
          >
            {item.packageTitle}
          </Link>
          <p className="text-xs text-brand-muted">Destination: {item.destCity}, {item.destCountry}</p>
          <div className="mt-2 flex items-center gap-2">
            <img
              src={`https://api.dicebear.com/9.x/personas/svg?seed=${item.counterpart.id}&backgroundColor=e8edf5`}
              alt={item.counterpart.nickname}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-xs text-brand-muted">
              {item.viewerRole === "sender" ? "Traveler" : "Sender"}:{" "}
              <span className="font-medium text-brand-primary">{item.counterpart.nickname}</span>
            </span>
          </div>
        </div>

        {cta ? (
          <Link
            to={cta.url}
            className="rounded-lg bg-brand-accent px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            {cta.label}
          </Link>
        ) : (
          <p className="text-xs italic text-brand-muted">
            Waiting on {item.viewerRole === "sender" ? item.counterpart.nickname : "you"}...
          </p>
        )}
      </div>
    </div>
  );
}

function CompletedWorkflowCard({ item }: { item: WorkflowItem }) {
  return (
    <Link
      to={`/deliveries/${item.deliveryId}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <WorkflowProgressBar delivery={{ status: item.status, hasReview: item.hasReview }} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-muted/10 pt-3 text-xs">
        <div>
          <p className="font-semibold text-brand-primary">{item.packageTitle}</p>
          <p className="text-brand-muted">
            {item.destCity}, {item.destCountry} ·{" "}
            {item.viewerRole === "sender" ? "Traveler" : "Sender"}: {item.counterpart.nickname}
          </p>
        </div>
        <div className="text-right text-brand-muted">
          <p className="font-semibold text-brand-primary">
            {item.agreedAmount} {item.currency}
          </p>
          {item.finalizedAt && <p>{new Date(item.finalizedAt).toLocaleDateString()}</p>}
          {item.viewerRole === "traveler" && item.commissionAmount != null && (
            <p>
              Commission: {item.commissionAmount} {item.currency} ({item.commissionPaid ? "paid" : "unpaid"})
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function PackageSummaryCard({ pkg }: { pkg: MyPackageItem }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {pkg.goodsPhotoUrl ? (
          <img src={pkg.goodsPhotoUrl} alt={pkg.title} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-primary/5">
            <Package className="h-5 w-5 text-brand-primary/30" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link to={`/packages/${pkg.id}`} className="truncate font-medium text-brand-primary hover:text-brand-accent">
            {pkg.title}
          </Link>
          <p className="flex items-center gap-1 text-xs text-brand-muted">
            <Weight className="h-3 w-3" /> {pkg.weight} kg · {pkg.originCity} → {pkg.destCity}
          </p>
          {pkg.delivery ? (
            <span className="mt-1 inline-block rounded-full bg-brand-secondary/10 px-2 py-0.5 text-[10px] font-medium text-brand-secondary">
              {pkg.delivery.status}
            </span>
          ) : (
            <Link
              to={`/packages/${pkg.id}/propose`}
              title="Only propose after meeting the traveler in person and handing over the package."
              className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2 py-0.5 text-[10px] font-semibold text-brand-accent hover:bg-brand-accent/20"
            >
              Propose Delivery
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function TripSummaryCard({ trip }: { trip: MyTripItem }) {
  const isClosed = new Date(trip.departureDate) < new Date();
  return (
    <div className={`rounded-xl bg-white p-4 shadow-sm ${isClosed ? "opacity-60 grayscale-[30%]" : ""}`}>
      <div className="flex items-center justify-between">
        <Link to={`/trips/${trip.id}`} className="font-medium text-brand-primary hover:text-brand-accent">
          {trip.originCity} → {trip.destCity}
        </Link>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isClosed ? "bg-brand-muted/10 text-brand-muted" : "bg-green-100 text-green-700"
          }`}
        >
          {isClosed ? "Closed" : "Active"}
        </span>
      </div>
      <p className="mt-1 text-xs text-brand-muted">
        Departs {new Date(trip.departureDate).toLocaleDateString()}
        {trip.capacityWeight ? ` · ${trip.capacityWeight} kg capacity` : ""}
      </p>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-brand-muted/10" />
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export function WorkflowDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    setError(false);
    api
      .get("/auth/me/dashboard")
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <SkeletonBlock />;
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="mb-3 text-sm text-brand-muted">Could not load your activity. Please refresh.</p>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const workflowItems = buildWorkflowItems(data);
  const active = workflowItems.filter((w) => w.status === "PROPOSED" || w.status === "ACCEPTED");
  const completed = workflowItems.filter((w) => w.status === "FINALIZED");
  const hasUrgent = data.pendingActions.some((a) => a.priority === "urgent");
  const visibleCompleted = showAllCompleted ? completed : completed.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Section A — Pending Actions */}
      <div>
        <h2 className="mb-3 text-xl font-bold text-brand-primary">
          {data.pendingActions.length === 0
            ? "✓ You're all caught up!"
            : hasUrgent
            ? "⚡ Actions Required"
            : "📋 Your Next Steps"}
        </h2>
        {data.pendingActions.length === 0 ? (
          <div className="rounded-xl border-l-4 border-green-500 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              Nothing needs your attention right now. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.pendingActions.map((action, i) => (
              <ActionCard key={`${action.type}-${action.relatedId ?? i}`} action={action} />
            ))}
          </div>
        )}
      </div>

      {/* Section B — Active Workflows */}
      {active.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-brand-primary">Active Workflows</h2>
          <div className="space-y-4">
            {active.map((item) => (
              <ActiveWorkflowCard key={item.deliveryId} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Section C — Completed Workflows */}
      {completed.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-primary">
              Completed Deliveries ({completed.length})
            </h2>
            {completed.length > 3 && (
              <button
                onClick={() => setShowAllCompleted((v) => !v)}
                className="flex items-center gap-1 text-sm font-medium text-brand-accent hover:underline"
              >
                {showAllCompleted ? "Show less" : "Show all"}
                {showAllCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {visibleCompleted.map((item) => (
              <CompletedWorkflowCard key={item.deliveryId} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Section D — My Posts Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold text-brand-primary">
            My Packages ({data.myPackages.length})
          </h2>
          <div className="space-y-3">
            {data.myPackages.length === 0 ? (
              <p className="text-sm text-brand-muted">You haven't posted any packages yet.</p>
            ) : (
              data.myPackages.map((pkg) => <PackageSummaryCard key={pkg.id} pkg={pkg} />)
            )}
            <Link
              to="/packages/new"
              className="inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              + Post a Package
            </Link>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-brand-primary">My Trips ({data.myTrips.length})</h2>
          <div className="space-y-3">
            {data.myTrips.length === 0 ? (
              <p className="text-sm text-brand-muted">You haven't posted any trips yet.</p>
            ) : (
              data.myTrips.map((trip) => <TripSummaryCard key={trip.id} trip={trip} />)
            )}
            <Link
              to="/trips/new"
              className="inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              + Post a Trip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowDashboard;
