// src/pages/Spots.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import SpotsFilterBar from "@/components/SpotsFilterBar";
import SpotCard from "@/components/SpotCard";
import MapPanel from "@/components/MapPanel";
import { fetchSpots, countSpots, type Spot, type SpotFilter, distanceKm } from "@/lib/spots";
import { CITIES } from "@/lib/geo";
import { useSearchParams } from "react-router-dom";

const HERO_CHIPS = [
    { label: "하노이", cityId: "hanoi" },
    { label: "다낭", cityId: "da-nang" },
    { label: "호찌민", cityId: "ho-chi-minh" },
    { label: "카페", category: "카페·디저트" },
    { label: "맛집", category: "맛집" },
    { label: "호텔·숙소", category: "호텔·숙소" },
    { label: "야시장", category: "야시장" },
];

export default function SpotsPage() {
    const [params] = useSearchParams();

    const [filters, setFilters] = useState<SpotFilter>(() => {
        const p = Object.fromEntries(params.entries());
        return {
            isAdult: false,
            regionId: (p.regionId as string) || undefined,
            cityIds: p.cityIds ? p.cityIds.split(",") : undefined,
            districtIds: p.districtIds ? p.districtIds.split(",") : undefined,
            category: (p.category as string) || "all",
            sort: (p.sort as any) ?? "popular",
            q: p.q,
            openNow: p.openNow === "true" ? true : p.openNow === "false" ? false : undefined,
            minRating: p.minRating ? Number(p.minRating) : undefined,
            price: p.price ? (p.price.split(",").map((n) => Number(n)) as any) : undefined,
            near: p.near ? JSON.parse(p.near) : undefined,
        };
    });

    const [view, setView] = useState<"grid" | "list" | "split" | "map">("grid");
    const [items, setItems] = useState<Spot[]>([]);
    const [cursor, setCursor] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState<number | undefined>(undefined);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    // 데이터 로드
    useEffect(() => {
        (async () => {
            setLoading(true);
            const [listRes, totalRes] = await Promise.all([fetchSpots(filters, null), countSpots(filters)]);
            let list = listRes.items;

            // 근처 모드: 거리 계산 + 반경 필터 + 거리순 정렬
            if (filters.near && filters.near.lat && filters.near.lng) {
                list = list
                    .map((s) => s.location ? { ...s, distanceKm: distanceKm(filters.near!, s.location) } : s)
                    .filter((s) => s.distanceKm === undefined || s.distanceKm <= filters.near!.radiusKm)
                    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
            }

            setItems(list);
            setCursor(listRes.nextCursor);
            setTotal(totalRes);
            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)]);

    // 무한 스크롤
    useEffect(() => {
        const el = loaderRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && cursor && !loading) {
                (async () => {
                    setLoading(true);
                    const { items: more, nextCursor } = await fetchSpots(filters, cursor);
                    let merged = more;
                    if (filters.near && filters.near.lat && filters.near.lng) {
                        merged = merged
                            .map((s) => s.location ? { ...s, distanceKm: distanceKm(filters.near!, s.location) } : s)
                            .filter((s) => s.distanceKm === undefined || s.distanceKm <= filters.near!.radiusKm)
                            .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
                    }
                    setItems((prev) => [...prev, ...merged]);
                    setCursor(nextCursor);
                    setLoading(false);
                })();
            }
        }, { rootMargin: "400px" });
        io.observe(el);
        return () => io.disconnect();
        // eslint-disable-line
    }, [cursor, loading]);

    // 선택 요약 칩
    const selectionChips = useMemo(() => {
        const chips: { key: string; label: string; onRemove: () => void }[] = [];
        if (filters.regionId) chips.push({ key: "region", label: filters.regionId === "north" ? "북부" : filters.regionId === "central" ? "중부" : "남부", onRemove: () => setFilters({ ...filters, regionId: undefined }) });
        (filters.cityIds ?? []).forEach(id => {
            const c = CITIES.find(x => x.id === id);
            if (c) chips.push({ key: "city-" + id, label: c.ko, onRemove: () => setFilters({ ...filters, cityIds: filters.cityIds!.filter(v => v !== id) }) });
        });
        if (filters.category && filters.category !== "all") chips.push({ key: "cat", label: filters.category, onRemove: () => setFilters({ ...filters, category: "all" }) });
        if (filters.openNow) chips.push({ key: "open", label: "지금 영업", onRemove: () => setFilters({ ...filters, openNow: undefined }) });
        if (filters.near) chips.push({ key: "near", label: `내 주변 ${filters.near.radiusKm}km`, onRemove: () => setFilters({ ...filters, near: undefined, sort: "popular" }) });
        return chips;
    }, [filters]);

    return (
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-neutral-950">
            {/* HERO */}
            <section className="bg-gradient-to-b from-white to-[#F1F4F8] dark:from-neutral-900 dark:to-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                <div className="mx-auto max-w-screen-2xl px-4 py-10">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">여행 스팟</h1>
                    <p className="mt-2 text-neutral-800 dark:text-neutral-400">
                        도시·명소·맛집·카페·숙소까지 한 번에 찾기.<br className="hidden sm:block" />
                        지도와 필터로 딱 맞게 골라보세요.
                    </p>

                    {/* 추천 칩 */}
                    <div className="mt-5 flex flex-wrap gap-2">
                        {HERO_CHIPS.map(ch => (
                            <button
                                key={ch.label}
                                onClick={() => setFilters({
                                    ...filters,
                                    cityIds: ch.cityId ? [ch.cityId] : filters.cityIds,
                                    category: ch.category ?? filters.category,
                                })}
                                className="text-sm rounded-full bg-white border border-neutral-300 text-neutral-800 px-3 py-1 hover:bg-neutral-50"
                            >
                                {ch.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* 필터바 */}
            <SpotsFilterBar
                value={filters}
                onChange={(v) => setFilters({ ...v, isAdult: false })}
                view={view}
                onViewChange={setView}
                total={total}
                adultPage={false}
            />

            {/* 선택 요약 칩 + 모두 해제 */}
            <div className="mx-auto max-w-screen-2xl px-4 mt-3">
                {selectionChips.length ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {selectionChips.map((c) => (
                            <button key={c.key} onClick={c.onRemove} className="text-sm rounded-full bg-white border border-neutral-300 text-neutral-800 px-3 py-1">
                                {c.label} ✕
                            </button>
                        ))}
                        <button onClick={() => setFilters({ isAdult: false, sort: "popular" })} className="text-sm rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 px-3 py-1">
                            모두 해제
                        </button>
                    </div>
                ) : null}
            </div>

            {/* 본문 */}
            <main className="mx-auto max-w-screen-2xl px-4 py-6">
                {items.length === 0 && !loading ? (
                    <EmptyState
                        onReset={() => setFilters({ isAdult: false, sort: "popular" })}
                        onClearArea={() => setFilters({ ...filters, near: undefined, sort: "popular" })}
                    />
                ) : (
                    <>
                        {view === "map" ? (
                            <MapPanel
                                spots={items}
                                title="지도 • 여행 스팟"
                                full
                                onClose={() => setView("grid")}
                                onSearchThisArea={(center, radiusKm) => setFilters({ ...filters, near: { ...center, radiusKm }, sort: "distance" })}
                            />
                        ) : view === "split" ? (
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr,520px] gap-6">
                                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {items.map((s) => <SpotCard key={s.id} s={s} />)}
                                    {loading && Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
                                </div>
                                <div className="sticky top-28 h-[70vh]">
                                    <MapPanel
                                        spots={items}
                                        onClose={() => setView("grid")}
                                        title="지도 • 여행 스팟"
                                        onSearchThisArea={(center, radiusKm) => setFilters({ ...filters, near: { ...center, radiusKm }, sort: "distance" })}
                                    />
                                </div>
                            </div>
                        ) : view === "grid" ? (
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
                        )}
                        <div ref={loaderRef} className="h-8" />
                    </>
                )}
            </main>
        </div>
    );
}

function EmptyState({ onReset, onClearArea }: { onReset: () => void; onClearArea: () => void }) {
    return (
        <div className="rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 p-10 text-center">
            <p className="text-neutral-800 dark:text-neutral-300">조건에 맞는 스팟이 없습니다.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button onClick={onReset} className="rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2 bg-white hover:bg-neutral-50">추천순 보기</button>
                <button onClick={onClearArea} className="rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2 bg-white hover:bg-neutral-50">내 주변 해제</button>
                <button onClick={onReset} className="rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2 bg-white hover:bg-neutral-50">세부 지역 초기화</button>
            </div>
        </div>
    );
}
function CardSkeleton() { return <div className="animate-pulse rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 aspect-[4/3]" />; }
function RowSkeleton() { return <div className="animate-pulse h-40 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/40" />; }
