// src/pages/Home.tsx
import { useEffect, useState } from "react";
import SpotCard from "@/components/SpotCard";
import ReviewCard from "@/components/ReviewCard";
import { fetchSpots, type Spot } from "@/lib/spots";
import { getReviewsForPlace } from "@/lib/api"; // 기존 API 재사용 (spot id 전달)
import type { Review } from "@/types";

export default function Home() {
    const [spots, setSpots] = useState<Spot[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    useEffect(() => {
        (async () => {
            // 여행 스팟(일반) 상위 추천 로드
            const { items } = await fetchSpots({ isAdult: false, sort: "popular" });
            const top = items.slice(0, 4);
            setSpots(top);

            // 최근 리뷰 2건(두 스팟에서 1개씩)
            if (top[0]) {
                const r1 = await getReviewsForPlace(top[0].id, { limit: 1 });
                if (r1?.[0]) setReviews((x) => [...x, r1[0]]);
            }
            if (top[1]) {
                const r2 = await getReviewsForPlace(top[1].id, { limit: 1 });
                if (r2?.[0]) setReviews((x) => [...x, r2[0]]);
            }
        })();
    }, []);

    return (
        <div className="grid gap-10">
            <section>
                <h2 className="mb-3 text-xl font-bold text-fg-title">오늘의 도시별 핫스팟</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {spots.map((s) => (
                        <SpotCard key={s.id} s={s} />
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
