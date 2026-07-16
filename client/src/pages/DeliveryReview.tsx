import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Star, Package } from "lucide-react";
import { SEO } from "../components/SEO";

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface DeliveryData {
  id: string;
  senderId: string;
  travelerId: string;
  agreedAmount: number;
  currency: string;
  status: string;
  finalizedAt: string | null;
  package: { id: string; title: string; destCity: string; destCountry: string };
  traveler: { id: string; nickname: string; legalFullName?: string };
  review: ReviewData | null;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5"
        >
          <Star
            className={`h-8 w-8 transition ${
              star <= (hovered || value)
                ? "fill-brand-accent text-brand-accent"
                : "text-brand-muted/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReadOnlyStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 ${
            star <= rating
              ? "fill-brand-accent text-brand-accent"
              : "text-brand-muted/30"
          }`}
        />
      ))}
    </div>
  );
}

function DeliveryReview() {
  const { t } = useTranslation();
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/deliveries/${deliveryId}`)
      .then((res) => setDelivery(res.data.delivery))
      .catch(() => toast.error(t("deliveryReview.toastLoadFailed")))
      .finally(() => setLoading(false));
  }, [deliveryId]);

  const onSubmit = async () => {
    if (rating === 0) {
      toast.error(t("deliveryReview.toastSelectRating"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/reviews/${deliveryId}`, { rating, comment: comment || undefined });
      toast.success(t("deliveryReview.toastSubmitSuccess"));
      navigate("/profile?tab=deliveries");
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("deliveryReview.toastSubmitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (!delivery)
    return (
      <div className="py-16 text-center">
        <p className="text-brand-muted">{t("deliveryReview.notFound")}</p>
      </div>
    );

  if (user?.id !== delivery.senderId) {
    return (
      <div className="py-16 text-center">
        <p className="text-brand-muted">
          {t("deliveryReview.notSenderMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <SEO
        titleEn="Leave a Review"
        titleFa="ثبت نظر"
        descriptionEn="Leave a review for the traveler who delivered your package."
        descriptionFa="برای مسافری که بسته شما را تحویل داد نظر بدهید."
        path="/deliveries/review"
        noIndex
      />
      <Link
        to="/profile?tab=deliveries"
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("deliveryReview.backToDeliveries")}
      </Link>

      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-brand-primary">
          {t("deliveryReview.pageTitle")}
        </h1>

        {/* Package + delivery summary */}
        <div className="mb-6 rounded-xl border border-brand-muted/10 bg-brand-bg p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-accent" />
            <span className="font-medium text-brand-primary">
              {delivery.package.title}
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-muted">
            {delivery.package.destCity}, {delivery.package.destCountry}
          </p>
          <p className="mt-2 text-sm text-brand-muted">
            {delivery.agreedAmount} {delivery.currency}
            {delivery.finalizedAt &&
              ` ${t("deliveryReview.deliveredOn", { date: new Date(delivery.finalizedAt).toLocaleDateString() })}`}
          </p>
        </div>

        {/* Traveler */}
        <div className="mb-6 flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${delivery.traveler.id}&backgroundColor=b6e3f4,c0aede,d1d4f9&backgroundType=gradientLinear`}
            alt={delivery.traveler.nickname}
            className="h-12 w-12 rounded-full border-2 border-brand-primary/10 object-cover"
          />
          <div>
            <p className="text-xs text-brand-muted">{t("deliveryReview.traveler")}</p>
            <Link
              to={`/users/${delivery.traveler.id}`}
              className="font-medium text-brand-primary hover:text-brand-accent"
            >
              {delivery.traveler.legalFullName || delivery.traveler.nickname}
            </Link>
          </div>
        </div>

        {delivery.review ? (
          <div className="rounded-xl border border-brand-muted/10 bg-brand-bg p-4">
            <p className="mb-2 text-sm font-medium text-brand-primary">
              {t("deliveryReview.alreadyReviewed")}
            </p>
            <ReadOnlyStars rating={delivery.review.rating} />
            {delivery.review.comment && (
              <p className="mt-3 text-sm text-brand-muted">
                {delivery.review.comment}
              </p>
            )}
            <p className="mt-2 text-xs text-brand-muted/60">
              {new Date(delivery.review.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-brand-primary">
                {t("deliveryReview.ratingLabel")}
              </label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-primary">
                {t("deliveryReview.commentLabel")}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder={t("deliveryReview.commentPlaceholder")}
                className="w-full rounded-lg border border-brand-muted/30 bg-brand-bg px-4 py-2.5 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("deliveryReview.submitReview")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryReview;
