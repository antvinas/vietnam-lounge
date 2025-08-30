// src/pages/My.tsx
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { getPlaces, getMyReviews } from "@/lib/api";
import PlaceCard from "@/components/PlaceCard";
import type { Place, Review } from "@/types";
import { Card, CardTitle, CardText } from "@/components/ui/Card";
import ReviewCard from "@/components/ReviewCard";
import Button from "@/components/ui/Button";

export default function My() {
    const { bookmarks, user, signIn, signOut } = useApp();
    const [saved, setSaved] = useState<Place[]>([]);
    const [myReviews, setMyReviews] = useState<Review[]>([]);

    useEffect(() => {
        (async () => {
            const all = await getPlaces({ limit: 999 });
            setSaved(all.filter((p) => bookmarks.has(p.id)));
        })();
    }, [bookmarks]);

    useEffect(() => {
        (async () => {
            if (!user) {
                setMyReviews([]);
                return;
            }
            const r = await getMyReviews(user.uid, { limit: 10 });
            setMyReviews(r);
        })();
    }, [user]);

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-fg-title">마이 대시보드</h1>
                {user ? (
                    <Button variant="outline" onClick={signOut}>로그아웃</Button>
                ) : (
                    <Button variant="outline" onClick={signIn}>로그인</Button>
                )}
            </div>

            {/* 북마크 */}
            <section className="grid gap-3">
                <h2 className="text-lg font-semibold text-fg-title">북마크한 장소</h2>
                {saved.length === 0 && (
                    <div className="rounded-xl border border-border-subtle p-3 text-sm text-fg-muted">
                        북마크한 장소가 없습니다.
                    </div>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {saved.map((p) => (
                        <PlaceCard key={p.id} place={p} />
                    ))}
                </div>
            </section>

            {/* 내 후기 */}
            <section className="grid gap-3">
                <h2 className="text-lg font-semibold text-fg-title">내 후기</h2>
                {myReviews.length === 0 ? (
                    <Card>
                        <CardTitle>아직 작성한 후기가 없습니다.</CardTitle>
                        <CardText className="text-sm">
                            마음에 드는 장소에서 첫 리뷰를 남겨보세요!
                        </CardText>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {myReviews.map((r) => (
                            <ReviewCard key={r.id} review={r} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
