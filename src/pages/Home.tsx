// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { getPlaces, getReviewsForPlace } from "@/lib/api";
import PlaceCard from "@/components/PlaceCard";
import ReviewCard from "@/components/ReviewCard";
import type { Place, Review } from "@/types";

export default function Home() {
    const [places, setPlaces] = useState<Place[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        (async () => {
            const p = await getPlaces({ limit: 4, sort: "topSafety" });
            setPlaces(p);
            // 최근 리뷰 2건(두 장소에서 1개씩)
            if (p[0]) {
                const r1 = await getReviewsForPlace(p[0].id, { limit: 1 });
                if (r1[0]) setReviews((x) => [...x, r1[0]]);
            }
            if (p[1]) {
                const r2 = await getReviewsForPlace(p[1].id, { limit: 1 });
                if (r2[0]) setReviews((x) => [...x, r2[0]]);
            }
        })();
    }, []);

    return (
        <div className="grid gap-10">
            <section>
                <h2 className="mb-3 text-xl font-bold text-fg-title">오늘의 도시별 핫스팟</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {places.map((p) => (
                        <PlaceCard key={p.id} place={p} />
                    ))}
                </div>
            </section>

            <section>
                <h2 className="mb-3 text-xl font-bold text-fg-title">신규 후기</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {reviews.map((r) => (
                        <ReviewCard key={r.id} review={r} />
                    ))}
                    {reviews.length === 0 && (
                        <div className="rounded-xl border border-border-subtle p-4 text-sm text-fg-muted">
                            아직 표시할 후기가 없습니다.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
