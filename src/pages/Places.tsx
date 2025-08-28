// src/pages/Places.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getPlaces } from "@/lib/api";
import PlaceCard from "@/components/PlaceCard";
import SearchBar from "@/components/SearchBar";
import Filters from "@/components/Filters";
import type { Place } from "@/types";
import Button from "@/components/ui/Button";

export default function Places() {
    const [params, setParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Place[]>([]);
    const [showMap, setShowMap] = useState(false); // 지도 토글 (후속 파트에서 지도 붙이기 용)

    const q = params.get("q") ?? "";
    const city = params.get("city") ?? "";
    const category = params.get("category") ?? "";

    const setParam = (k: string, v: string) => {
        const next = new URLSearchParams(params);
        if (v) next.set(k, v);
        else next.delete(k);
        setParams(next, { replace: true });
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await getPlaces({ q, city, category, limit: 30 });
            setData(res);
            setLoading(false);
        })();
    }, [q, city, category]);

    const total = useMemo(() => data.length, [data]);

    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl font-bold text-fg-title">장소</h1>
                <Button variant="outline" onClick={() => setShowMap((v) => !v)}>
                    {showMap ? "리스트 보기" : "지도 보기"}
                </Button>
            </div>

            <SearchBar value={q} onChange={(v) => setParam("q", v)} />
            <Filters
                city={city}
                onCity={(v) => setParam("city", v)}
                category={category}
                onCategory={(v) => setParam("category", v)}
            />

            {loading ? (
                <div className="h-28 w-full animate-pulse rounded bg-border-subtle" />
            ) : showMap ? (
                <div className="rounded-xl border border-border-subtle p-4 text-sm text-fg-muted">
                    (MVP) 지도가 여기에 표시됩니다.
                </div>
            ) : (
                <>
                    <div className="text-xs text-fg-muted">총 {total}개 결과</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {data.map((p) => (
                            <PlaceCard key={p.id} place={p} />
                        ))}
                        {data.length === 0 && (
                            <div className="rounded-xl border border-border-subtle p-4 text-sm text-fg-muted">
                                조건에 맞는 장소가 없습니다. 필터를 조정해 보세요.{" "}
                                <Link to="/places" className="text-brand-secondary underline">
                                    모두 보기
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
