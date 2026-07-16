import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

export interface ProgressDelivery {
  status: "PROPOSED" | "ACCEPTED" | "FINALIZED" | "CANCELLED";
  hasReview: boolean;
}

function computeCompleteFlags(delivery: ProgressDelivery) {
  const step3Complete = delivery.status === "ACCEPTED" || delivery.status === "FINALIZED";
  const step4Complete = delivery.status === "FINALIZED";
  const step5Complete = delivery.hasReview;
  return [true, true, step3Complete, step4Complete, step5Complete];
}

export function WorkflowProgressBar({ delivery }: { delivery: ProgressDelivery }) {
  const { t } = useTranslation();
  const STEP_LABELS = [
    t("workflowProgressBar.posted"),
    t("workflowProgressBar.proposed"),
    t("workflowProgressBar.accepted"),
    t("workflowProgressBar.delivered"),
    t("workflowProgressBar.reviewed"),
  ];
  const completeFlags = computeCompleteFlags(delivery);
  const isCancelled = delivery.status === "CANCELLED";
  const activeIndex = isCancelled ? -1 : completeFlags.findIndex((c) => !c);

  return (
    <div className="flex items-start">
      {STEP_LABELS.map((label, i) => {
        const complete = completeFlags[i];
        const isActive = i === activeIndex;
        const isLast = i === STEP_LABELS.length - 1;

        return (
          <div key={label} className={`flex items-start ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center">
              <div
                className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  complete
                    ? "bg-brand-accent text-white"
                    : isActive
                    ? "bg-brand-secondary text-white"
                    : "border-2 border-brand-muted/30 text-brand-muted"
                }`}
              >
                {isActive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-secondary opacity-50" />
                )}
                <span className="relative">
                  {complete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
              </div>
              <span
                className={`mt-1 whitespace-nowrap text-center text-[10px] ${
                  complete
                    ? "font-bold text-brand-primary"
                    : isActive
                    ? "font-bold italic text-brand-secondary"
                    : "text-brand-muted"
                }`}
              >
                {isActive ? `${label} →` : label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mx-1 mt-3.5 h-0.5 flex-1 ${
                  complete ? "bg-brand-accent" : "bg-brand-muted/20"
                }`}
              />
            )}
          </div>
        );
      })}

      {isCancelled && (
        <span className="ml-2 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-brand-danger">
          {t("workflowProgressBar.cancelled")}
        </span>
      )}
    </div>
  );
}

export default WorkflowProgressBar;
