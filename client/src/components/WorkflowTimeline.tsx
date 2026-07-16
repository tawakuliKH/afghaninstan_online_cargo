import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Package, Truck, PackageCheck, Star } from "lucide-react";

export interface WorkflowDelivery {
  id: string;
  status: "PROPOSED" | "ACCEPTED" | "FINALIZED" | "CANCELLED";
  senderId: string;
  travelerId: string;
  createdAt: string;
  acceptedAt: string | null;
  finalizedAt: string | null;
  package: { id: string; title: string; createdAt: string };
  sender: { id: string; nickname: string };
  traveler: { id: string; nickname: string };
  review: { id: string; rating: number; comment?: string | null; createdAt: string } | null;
}

interface WorkflowTimelineProps {
  delivery: WorkflowDelivery;
  viewerId?: string;
  onAccept?: () => void;
  onFinalize?: () => void;
}

interface Step {
  title: string;
  description: string;
  timestamp: string | null;
  complete: boolean;
  icon: React.ElementType;
}

function formatTimestamp(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StepCircle({
  complete,
  active,
  icon: Icon,
}: {
  complete: boolean;
  active: boolean;
  icon: React.ElementType;
}) {
  if (complete) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white">
        <Check className="h-4 w-4" />
      </div>
    );
  }
  if (active) {
    return (
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-white">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-secondary opacity-50" />
        <Icon className="relative h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-muted/30 text-brand-muted">
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function WorkflowTimeline({ delivery, viewerId, onAccept, onFinalize }: WorkflowTimelineProps) {
  const { t } = useTranslation();
  const isSender = viewerId === delivery.senderId;
  const isTraveler = viewerId === delivery.travelerId;
  const isCancelled = delivery.status === "CANCELLED";

  const step3Complete = delivery.status === "ACCEPTED" || delivery.status === "FINALIZED";
  const step4Complete = delivery.status === "FINALIZED";
  const step5Complete = Boolean(delivery.review);

  const steps: Step[] = [
    {
      title: t("workflowTimeline.packagePostedTitle"),
      description: t("workflowTimeline.packagePostedDesc", { title: delivery.package.title }),
      timestamp: delivery.package.createdAt,
      complete: true,
      icon: Package,
    },
    {
      title: t("workflowTimeline.deliveryProposedTitle"),
      description: t("workflowTimeline.deliveryProposedDesc", {
        sender: delivery.sender.nickname,
        traveler: delivery.traveler.nickname,
      }),
      timestamp: delivery.createdAt,
      complete: true,
      icon: Truck,
    },
    {
      title: t("workflowTimeline.travelerAcceptedTitle"),
      description: isCancelled
        ? t("workflowTimeline.travelerAcceptedCancelledDesc")
        : t("workflowTimeline.travelerAcceptedDesc", { traveler: delivery.traveler.nickname }),
      timestamp: delivery.acceptedAt,
      complete: step3Complete,
      icon: Check,
    },
    {
      title: t("workflowTimeline.packageDeliveredTitle"),
      description: t("workflowTimeline.packageDeliveredDesc", { traveler: delivery.traveler.nickname }),
      timestamp: delivery.finalizedAt,
      complete: step4Complete,
      icon: PackageCheck,
    },
    {
      title: t("workflowTimeline.reviewSubmittedTitle"),
      description: delivery.review
        ? t("workflowTimeline.reviewSubmittedDoneDesc", { sender: delivery.sender.nickname, rating: delivery.review.rating })
        : t("workflowTimeline.reviewSubmittedPendingDesc", { sender: delivery.sender.nickname }),
      timestamp: delivery.review?.createdAt ?? null,
      complete: step5Complete,
      icon: Star,
    },
  ];

  const activeIndex = steps.findIndex((s) => !s.complete);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const isActive = !isCancelled && i === activeIndex;
        const isLast = i === steps.length - 1;
        const ts = formatTimestamp(step.timestamp);

        return (
          <div key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepCircle complete={step.complete} active={isActive} icon={step.icon} />
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 ${step.complete ? "bg-brand-accent" : "bg-brand-muted/20"}`}
                  style={{ minHeight: "1.5rem" }}
                />
              )}
            </div>
            <div className="pb-6">
              <p className="text-sm font-semibold text-brand-primary">{step.title}</p>
              <p className="text-xs text-brand-muted">{step.description}</p>
              {ts && <p className="mt-0.5 text-xs text-brand-muted/70">{ts}</p>}

              {isActive && i === 2 && isTraveler && onAccept && (
                <button
                  onClick={onAccept}
                  className="mt-2 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  {t("workflowTimeline.acceptDeliveryButton")}
                </button>
              )}
              {isActive && i === 3 && isTraveler && onFinalize && (
                <button
                  onClick={onFinalize}
                  className="mt-2 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  {t("workflowTimeline.finalizeDeliveryButton")}
                </button>
              )}
              {isActive && i === 4 && isSender && (
                <Link
                  to={`/deliveries/${delivery.id}/review`}
                  className="mt-2 inline-block rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  {t("workflowTimeline.completeReviewButton")}
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {isCancelled && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-brand-danger">
          {t("workflowTimeline.cancelledNotice")}
        </div>
      )}
    </div>
  );
}

export default WorkflowTimeline;
