// src/pages/PlaceDetail.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SafetyScoreWidget from "@/components/SafetyScoreWidget";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import Badge from "@/components/ui/Badge";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import ReportDialog from "@/components/ReportDialog";
import Button from "@/components/ui/Button";
import StructuredData from "@/components/StructuredData";
import { useToast } from "@/components/Toast";
import {
    addReview,
    getPlace,
    getReviewsForPlace,
    reportPlace,
} from "@/lib/api";
import type { Place, Review } from "@/types";

export default function PlaceDetail() {
    const { id = "" } = useParams();
    const [place, setPlace] = useState<Place | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [busy, setBusy] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        (async () => {
            setBusy(true);
            const p = await getPlace(id);
            setPlace(p);
            const r = await getReviewsForPlace(id, { limit: 20, sort: "new" });
            setReviews(r);
            setBusy(false);
        })();
    }, [id]);

    if (!place) {
        return (
            <div className="rounded-xl border border-border-subtle p-4 text-sm text-fg-muted">
                {busy ? "로딩 중..." : "장소를 찾을 수 없습니다."}
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {/* JSON-LD (SEO) */}
            <StructuredData
                json={{
                    "@context": "https://schema.org",
                    "@type": "LocalBusiness",
                    name: place.name,
                    image: place.cover ? [place.cover] : [],
                    address: { "@type": "PostalAddress", addressLocality: place.city, addressCountry: "VN" },
                    url: typeof window !== "undefined" ? window.location.href : "",
                    aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: place.scoreAvg?.toFixed(1) ?? "4.0",
                        reviewCount: Math.max(1, reviews.length || 1),
                    },
                    priceRange: "$$",
                    servesCuisine: place.category,
                }}
            />

            {/* 헤더 */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-fg-title">{place.name}</h1>
                        {place.verified && <VerifiedBadge />}
                    </div>
                    <div className="text-sm text-fg-muted">
                        {place.city} · {place.category}
                    </div>
                </div>

                <div className="flex gap-2">
                    <ReportDialog
                        onReport={(reason) => reportPlace(place.id, reason)}
                        trigger={<Button variant="outline">신고</Button>}
                    />
                    <Button
                        variant="outline"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            addToast({ title: "링크 복사", desc: "페이지 URL이 복사되었습니다." });
                        }}
                    >
                        공유
                    </Button>
                </div>
            </div>

            {/* 이미지 */}
            {place.cover && (
                <img
                    src={place.cover}
                    alt={`${place.name} cover`}
                    className="aspect-[16/9] w-full rounded-xl object-cover"
                    loading="lazy"
                />
            )}

            {/* 여성안심 지수 */}
            <SafetyScoreWidget score={place.score} />

            {/* 태그 */}
            {place.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                    {place.tags.map((t) => (
                        <Badge key={t}>{t}</Badge>
                    ))}
                </div>
            ) : null}

            {/* 리뷰 목록 */}
            <section className="grid gap-3">
                <h2 className="text-xl font-bold text-fg-title">리뷰</h2>
                {reviews.length === 0 && (
                    <div className="rounded-xl border border-border-subtle p-3 text-sm text-fg-muted">
                        아직 리뷰가 없습니다.
                    </div>
                )}
                {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                ))}

                {/* 리뷰 작성 */}
                <div className="rounded-xl border border-border-subtle p-3">
                    <h3 className="mb-2 font-semibold text-fg-title">리뷰 작성</h3>
                    <ReviewForm
                        onSubmit={async (user, rating, text) => {
                            await addReview({ placeId: place.id, user, rating, text });
                            const r = await getReviewsForPlace(place.id, { limit: 20, sort: "new" });
                            setReviews(r);
                        }}
                    />
                </div>
            </section>
        </div>
    );
}
