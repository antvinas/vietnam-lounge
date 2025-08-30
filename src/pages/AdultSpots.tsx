// src/pages/AdultSpots.tsx
import { useEffect, useRef, useState } from "react";
import SpotsFilterBar from "@/components/SpotsFilterBar";
import SpotCard from "@/components/SpotCard";
import MapPanel from "@/components/MapPanel";
import { fetchSpots, countSpots, type Spot, type SpotFilter } from "@/lib/spots";

export default function AdultSpotsPage() {
    const [filters, setFilters] = useState<SpotFilter>({
        isAdult: true,
        sort: "popular",
    });

    const [view, setView] = useState<"grid" | "list" | "split">("grid");
    const [items, setItems] = useState<Spot[]>([]);
    const [cursor, setCursor] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState<number | undefined>(undefined);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [listRes, totalRes] = await Promise.all([fetchSpots(filters, null), countSpots(filters)]);
            setItems(listRes.items);
            setCursor(listRes.nextCursor);
            setTotal(totalRes);
            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        const el = loaderRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && cursor && !loading) {
                (async () => {
                    setLoading(true);
                    const { items: more, nextCursor } = await fetchSpots(filters, cursor);
                    setItems((prev) => [...prev, ...more]);
                    setCursor(nextCursor);
                    setLoading(false);
                })();
            }
        }, { rootMargin: "400px" });
        io.observe(el);
        return () => io.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cursor, loading]);

    return (
        <div className="min-h-screen">
            <section className="bg-gradient-to-b from-neutral-100 to-white dark:from-neutral-900 dark:to-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                <div className="mx-auto max-w-screen-2xl px-4 py-10">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">성인 19+ 스팟</h1>
                    <p className="mt-2 text-neutral-700 dark:text-neutral-400">KTV/가라오케, 나이트클럽, 19+ 라운지, 성인 마사지 등 성인 전용 카테고리만 표시됩니다.</p>
                </div>
            </section>

            <SpotsFilterBar
                value={filters}
                onChange={(v) => setFilters({ ...v, isAdult: true })}
                view={view}
                onViewChange={setView}
                total={total}
                adultPage
            />

            <main className="mx-auto max-w-screen-2xl px-4 py-6">
                {items.length === 0 && !loading ? (
                    <EmptyState onReset={() => setFilters({ isAdult: true, sort: "popular" })} />
                ) : (
                    <>
                        {view !== "split" ? (
                            view === "grid" ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {items.map((s) => <SpotCard key={s.id} s={s} />)}
                                    {loading && Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((s) => (
                                        <div key={s.id} className="grid grid-cols-1 sm:grid-cols-[320px,1fr] gap-4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">
                                            <img src={s.coverImage || "/placeholder.jpg"} className="w-full h-48 sm:h-full object-cover" />
                                            <div className="p-4">
                                                <SpotCard s={s} />
                                            </div>
                                        </div>
                                    ))}
                                    {loading && Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
                                </div>
                            )
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr,520px] gap-6">
                                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {items.map((s) => <SpotCard key={s.id} s={s} />)}
                                    {loading && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                                </div>
                                <div className="sticky top-28 h-[70vh]">
                                    <MapPanel spots={items} onClose={() => setView("grid")} title="지도 • 성인 스팟" />
                                </div>
                            </div>
                        )}
                        <div ref={loaderRef} className="h-8" />
                    </>
                )}
            </main>
        </div>
    );
}

function EmptyState({ onReset }: { onReset: () => void }) {
    return (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 p-10 text-center">
            <p className="text-neutral-700 dark:text-neutral-300">조건에 맞는 스팟이 없습니다.</p>
            <button onClick={onReset} className="mt-4 rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                모두 보기
            </button>
        </div>
    );
}
function CardSkeleton() {
    return <div className="animate-pulse rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/40 aspect-[4/3]" />;
}
function RowSkeleton() {
    return <div className="animate-pulse h-40 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/40" />;
}
