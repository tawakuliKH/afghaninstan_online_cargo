import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import api from "../lib/axios";
import {
  Star,
  MapPin,
  Package,
  MessageSquare,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { SEO } from "../components/SEO";

interface PublicUser {
  id: string;
  nickname: string;
  legalFullName?: string;
  whatsappNumber?: string;
  email?: string;
  currentCountry?: string;
  currentCity?: string;
  rating: number;
  reviewCount: number;
  packagesDeliveredCount: number;
  accountStatus: string;
  createdAt: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: { id: string; nickname: string };
}

function Avatar({
  nickname,
  userId,
  size = "lg",
}: {
  nickname: string;
  userId: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-9 w-9",
    md: "h-12 w-12",
    lg: "h-20 w-20",
    xl: "h-28 w-28",
  };

  const avatarUrl = `https://api.dicebear.com/9.x/personas/svg?seed=${userId}&backgroundColor=e8edf5`;

  return (
    <div
      className={`overflow-hidden rounded-full border-2 border-brand-primary/10 ${sizes[size]}`}
    >
      <img
        src={avatarUrl}
        alt={nickname}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? "fill-brand-accent text-brand-accent" : "text-brand-muted/30"}`}
        />
      ))}
    </div>
  );
}

function UserProfile() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [viewerCanSeeContact, setViewerCanSeeContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get(`/auth/users/${userId}/profile`)
      .then((res) => {
        setProfileUser(res.data.user);
        setReviews(res.data.reviews);
        setViewerCanSeeContact(res.data.viewerCanSeeContact);
      })
      .catch(() => toast.error(t("userProfile.toastNotFound")))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSendMessage = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setSending(true);
    try {
      await api.post("/messages", {
        receiverId: userId,
        content: t("userProfile.defaultMessageText"),
      });
      navigate(`/messages/${userId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t("userProfile.toastMessageFailed"));
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );

  if (!profileUser)
    return (
      <div className="py-16 text-center">
        <p className="text-brand-muted">{t("userProfile.notFound")}</p>
      </div>
    );

  const isOwnProfile = currentUser?.id === userId;
  const canMessage = currentUser?.accountStatus === "APPROVED" && !isOwnProfile;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SEO
        titleEn={`${profileUser.nickname}'s Profile`}
        titleFa={`پروفایل ${profileUser.nickname}`}
        descriptionEn={`View ${profileUser.nickname}'s rating, reviews, and delivery history on Afghanistan Online Cargo.`}
        descriptionFa={`امتیاز، نظرات و سابقه تحویل ${profileUser.nickname} را در کارگو آنلاین افغانستان مشاهده کنید.`}
        path={`/users/${userId}`}
      />
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("userProfile.back")}
      </button>

      {/* Profile card */}
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              nickname={profileUser.nickname}
              userId={profileUser.id}
              size="xl"
            />
            <div>
              <h1 className="text-2xl font-bold text-brand-primary">
                {profileUser.legalFullName || profileUser.nickname}
              </h1>
              <p className="text-sm text-brand-muted">
                @{profileUser.nickname}
              </p>
              {profileUser.currentCity && (
                <p className="mt-1 flex items-center gap-1 text-sm text-brand-muted">
                  <MapPin className="h-3 w-3" />
                  {profileUser.currentCity}, {profileUser.currentCountry}
                </p>
              )}
              <p className="mt-1 text-xs text-brand-muted">
                {t("userProfile.memberSince", { date: new Date(profileUser.createdAt).toLocaleDateString() })}
              </p>
            </div>
          </div>

          {/* Message button */}
          {canMessage && (
            <button
              onClick={handleSendMessage}
              disabled={sending}
              className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {t("userProfile.sendMessage")}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-brand-muted/10 pt-6">
          <div className="text-center">
            <div className="flex justify-center">
              <StarRating rating={profileUser.rating} />
            </div>
            <p className="mt-1 text-3xl font-bold text-brand-primary">
              {profileUser.rating > 0 ? profileUser.rating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-brand-muted">{t("userProfile.ratingLabel")}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-brand-primary">
              {profileUser.reviewCount}
            </p>
            <p className="text-xs text-brand-muted">{t("userProfile.reviewsLabel")}</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center">
              <Package className="h-5 w-5 text-brand-accent" />
            </div>
            <p className="text-3xl font-bold text-brand-primary">
              {profileUser.packagesDeliveredCount}
            </p>
            <p className="text-xs text-brand-muted">{t("userProfile.packagesDeliveredLabel")}</p>
          </div>
        </div>

        {/* Contact info */}
        {viewerCanSeeContact &&
          (profileUser.whatsappNumber || profileUser.email) && (
            <div className="mt-6 rounded-xl border border-brand-muted/20 bg-brand-bg p-4">
              <p className="mb-2 text-xs font-semibold uppercase text-brand-muted">
                {t("userProfile.contactHeading")}
              </p>
              {profileUser.whatsappNumber && (
                <p className="text-sm text-brand-primary">
                  {t("contactInfo.whatsappLabel")}
                  <span className="font-medium">
                    {profileUser.whatsappNumber}
                  </span>
                </p>
              )}
              {profileUser.email && (
                <p className="text-sm text-brand-primary">
                  {t("contactInfo.emailLabel")}
                  <span className="font-medium">{profileUser.email}</span>
                </p>
              )}
            </div>
          )}

        {!viewerCanSeeContact && (
          <div className="mt-6 rounded-xl border border-brand-muted/20 bg-brand-bg p-4 text-center">
            <p className="text-sm text-brand-muted">
              {!currentUser ? (
                <>
                  <Link
                    to="/register"
                    className="text-brand-accent hover:underline"
                  >
                    {t("contactInfo.anonPrefix")}
                  </Link>
                  {t("contactInfo.anonSuffix")}
                </>
              ) : (
                t("userProfile.postToSeeContact")
              )}
            </p>
          </div>
        )}
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-bold text-brand-primary">
            {t("userProfile.reviewsHeading", { count: profileUser.reviewCount })}
          </h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar nickname={review.reviewer.nickname} userId={review.reviewer.id} size="sm" />
                    <Link
                      to={`/users/${review.reviewer.id}`}
                      className="text-sm font-medium text-brand-primary hover:text-brand-accent"
                    >
                      {review.reviewer.nickname}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-brand-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-brand-muted">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
