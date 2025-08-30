// src/components/SpotsFilterBar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Map, MapPinned, List, Grid3X3, Target, X, LocateFixed } from "lucide-react";
import type { SpotFilter, Near } from "@/lib/spots";
import { useSearchParams } from "react-router-dom";
import { REGIONS, CITIES, DISTRICTS, GENERAL_CATEGORIES, ADULT_CATEGORIES, type RegionId } from "@/lib/geo";
import { createPortal } from "react-dom";

type Props = {
    value: SpotFilter;
    onChange: (v: SpotFilter) => void;
    view: "grid" | "list" | "split" | "map";
    onViewChange: (v: "grid" | "list" | "split" | "map") => void;
    total?: number;
    adultPage?: boolean;
};

function DrawerPortal({
    open, title, onClose, children,
}: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        if (!open) return;
        const prev = document.documentElement.style.overflow;
        document.documentElement.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => { document.documentElement.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    }, [open, onClose]);
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
            <section role="dialog" aria-modal="true" className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col">
                <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
                    <button aria-label="닫기" onClick={onClose} className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-900">
                        <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                    </button>
                </header>
                <div className="p-4 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]">{children}</div>
            </section>
        </div>,
        document.body
    );
}

export default function SpotsFilterBar({ value, onChange, view, onViewChange, total, adultPage }: Props) {
    const [q, setQ] = useState(value.q ?? "");
    const [, setParams] = useSearchParams();
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [nearOpen, setNearOpen] = useState(false);
    const [drawerSearch, setDrawerSearch] = useState("");

    // 단축키
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
            else if (e.key.toLowerCase() === "g") onViewChange("grid");
            else if (e.key.toLowerCase() === "l") onViewChange("list");
            else if (e.key.toLowerCase() === "m") onViewChange(view === "split" ? "grid" : "split");
            else if (e.key.toLowerCase() === "v") onViewChange("map");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onViewChange, view]);

    // 입력 디바운스
    useEffect(() => { const t = setTimeout(() => onChange({ ...value, q }), 300); return () => clearTimeout(t); /* eslint-disable-line */ }, [q]);

    // URL 동기화(isAdult 제외)
    useEffect(() => {
        const next = new URLSearchParams();
        const { isAdult, ...rest } = value;
        Object.entries(rest).forEach(([k, v]) => {
            if (Array.isArray(v) && v.length) next.set(k, v.join(","));
            else if (typeof v === "object" && v) next.set(k, JSON.stringify(v));
            else if (v !== undefined && v !== "" && v !== "all") next.set(k, String(v));
        });
        setParams(next, { replace: true });
    }, [JSON.stringify(value)]); // eslint-disable-line

    const set = (patch: Partial<SpotFilter>) => onChange({ ...value, ...patch });

    const citiesByRegion = useMemo(() => (value.regionId ? CITIES.filter(c => c.region === value.regionId) : CITIES), [value.regionId]);
    const districtsByCities = useMemo(() => {
        const setCityIds = new Set(value.cityIds ?? []);
        return DISTRICTS.filter(d => !value.cityIds?.length || setCityIds.has(d.cityId));
    }, [value.cityIds]);
    const categories = adultPage ? ADULT_CATEGORIES : GENERAL_CATEGORIES;

    // --- 내 주변 ---
    async function enableNear() {
        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 })
            );
            const near: Near = { lat: pos.coords.latitude, lng: pos.coords.longitude, radiusKm: value.near?.radiusKm ?? 3 };
            set({ near, sort: "distance" });
            setNearOpen(true);
        } catch {
            alert("위치 권한을 허용해 주세요. 또는 지도에서 '이 지역 검색'을 사용하세요.");
        }
    }

    return (
        <div className="sticky top-16 z-30 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
            <div className="mx-auto max-w-screen-2xl px-4 py-3 flex flex-wrap items-center gap-3">
                {/* 검색 */}
                <div className="flex-1 min-w-[260px]">
                    <input
                        ref={searchRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="도시, 스팟 또는 태그로 검색 ( / )"
                        className="w-full rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 px-4 py-2 outline-none focus:border-neutral-500 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100"
                    />
                </div>

                {/* 권역 */}
                <select
                    value={value.regionId ?? ""}
                    onChange={(e) => set({ regionId: (e.target.value || undefined) as RegionId | undefined, cityIds: undefined, districtIds: undefined })}
                    className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                >
                    <option value="">전체 권역</option>
                    {REGIONS.map(r => <option key={r.id} value={r.id}>{r.ko}</option>)}
                </select>

                {/* 핵심 도시 */}
                <select
                    value={(value.cityIds && value.cityIds[0]) ?? ""}
                    onChange={(e) => set({ cityIds: e.target.value ? [e.target.value] : undefined, districtIds: undefined })}
                    className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                >
                    <option value="">핵심 도시</option>
                    {citiesByRegion.map(c => <option key={c.id} value={c.id}>{c.ko}</option>)}
                </select>

                {/* 세부 지역 드로어 */}
                <button onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-900 dark:text-neutral-100" aria-expanded={drawerOpen} aria-haspopup="dialog">
                    <Target className="h-4 w-4" /> 세부 지역
                </button>

                {/* 카테고리 */}
                <select
                    value={value.category ?? "all"}
                    onChange={(e) => set({ category: e.target.value })}
                    className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                >
                    <option value="all">모든 카테고리</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* 정렬 */}
                <select
                    value={value.sort ?? "popular"}
                    onChange={(e) => set({ sort: e.target.value as any })}
                    className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                >
                    <option value="popular">추천순(인기+평점)</option>
                    <option value="rating">평점순</option>
                    <option value="reviews">리뷰많은순</option>
                    <option value="priceLow">가격 낮은순</option>
                    <option value="priceHigh">가격 높은순</option>
                    <option value="recent">업데이트순</option>
                    <option value="distance">거리순</option>
                </select>

                {/* 뷰 전환 + 내 주변 */}
                <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => onViewChange("grid")} className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 ${view === "grid" ? "ring-1 ring-neutral-300 dark:ring-neutral-700" : ""}`} aria-label="그리드(G)" title="그리드(G)">
                        <Grid3X3 className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                    </button>
                    <button onClick={() => onViewChange("list")} className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 ${view === "list" ? "ring-1 ring-neutral-300 dark:ring-neutral-700" : ""}`} aria-label="리스트(L)" title="리스트(L)">
                        <List className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                    </button>
                    {/* ⬇️ 분할 뷰는 MapPinned로 구분 */}
                    <button onClick={() => onViewChange(view === "split" ? "grid" : "split")} className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 ${view === "split" ? "ring-1 ring-neutral-300 dark:ring-neutral-700" : ""}`} aria-label="지도 분할(M)" title="지도 분할(M)">
                        <MapPinned className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                    </button>
                    {/* 전체 지도는 Map 아이콘 */}
                    <button onClick={() => onViewChange("map")} className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 ${view === "map" ? "ring-1 ring-neutral-300 dark:ring-neutral-700" : ""}`} aria-label="전체 지도(V)" title="전체 지도(V)">
                        <Map className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                    </button>
                    <button
                        onClick={() => (value.near ? setNearOpen(true) : enableNear())}
                        className={`ml-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 border ${value.near ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : "border-neutral-300 dark:border-neutral-700"} bg-white dark:bg-neutral-900`}
                        aria-label="내 주변 검색"
                        title="내 주변"
                    >
                        <LocateFixed className="h-4 w-4" />
                        내 주변
                    </button>
                </div>

                {/* 결과수 */}
                <div className="text-sm text-neutral-700 dark:text-neutral-400">
                    {typeof total === "number" ? `총 ${total}개` : ""}
                </div>
            </div>

            {/* === 세부 지역 드로어 === */}
            <DrawerPortal open={drawerOpen} title="세부 지역 선택" onClose={() => setDrawerOpen(false)}>
                <input
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="도시/구 검색"
                    className="w-full rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 px-3 py-2 mb-4 text-neutral-900 dark:text-neutral-100"
                />
                <section>
                    <div className="text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-100">도시(여러 개 선택 가능, 최대 10)</div>
                    <div className="grid grid-cols-2 gap-2">
                        {citiesByRegion
                            .filter(c => c.ko.includes(drawerSearch) || c.name.toLowerCase().includes(drawerSearch.toLowerCase()))
                            .map((c) => {
                                const checked = value.cityIds?.includes(c.id) ?? false;
                                return (
                                    <label key={c.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                                const current = new Set(value.cityIds ?? []);
                                                e.target.checked ? current.add(c.id) : current.delete(c.id);
                                                const next = Array.from(current).slice(0, 10);
                                                onChange({ ...value, cityIds: next, districtIds: undefined });
                                            }}
                                        />
                                        <span className="text-neutral-800 dark:text-neutral-200">{c.ko}</span>
                                    </label>
                                );
                            })}
                    </div>
                </section>

                <section className="mt-6">
                    <div className="text-sm font-medium mb-2 text-neutral-900 dark:text-neutral-100">구/지역(선택 시 도시 선택은 무시됨)</div>
                    <div className="grid grid-cols-2 gap-2">
                        {districtsByCities
                            .filter(d => d.ko.includes(drawerSearch) || d.name.toLowerCase().includes(drawerSearch.toLowerCase()))
                            .map((d) => {
                                const checked = value.districtIds?.includes(d.id) ?? false;
                                return (
                                    <label key={d.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                                const current = new Set(value.districtIds ?? []);
                                                e.target.checked ? current.add(d.id) : current.delete(d.id);
                                                const next = Array.from(current).slice(0, 10);
                                                onChange({ ...value, districtIds: next });
                                            }}
                                        />
                                        <span className="text-neutral-800 dark:text-neutral-200">{d.ko}</span>
                                    </label>
                                );
                            })}
                    </div>
                </section>

                {/* (깊은 옵션) 지금 영업 */}
                <section className="mt-6">
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-800 dark:text-neutral-300">
                        <input type="checkbox" checked={!!value.openNow} onChange={(e) => set({ openNow: e.target.checked })} />
                        지금 영업만 보기
                    </label>
                </section>
            </DrawerPortal>

            {/* === 내 주변 설정 드로어 === */}
            <DrawerPortal open={nearOpen} title="내 주변" onClose={() => setNearOpen(false)}>
                {value.near ? (
                    <div className="space-y-4">
                        <div className="text-sm text-neutral-700 dark:text-neutral-300">반경: <b>{value.near.radiusKm}km</b></div>
                        <input
                            type="range"
                            min={1} max={25} step={1}
                            value={value.near.radiusKm}
                            onChange={(e) => set({ near: { ...value.near!, radiusKm: Number(e.target.value) }, sort: "distance" })}
                            className="w-full"
                        />
                        <div className="flex gap-2">
                            {[1, 3, 5, 10, 15, 20].map(km => (
                                <button key={km} onClick={() => set({ near: { ...value.near!, radiusKm: km }, sort: "distance" })}
                                    className={`px-3 py-2 rounded-lg border ${value.near!.radiusKm === km ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : "border-neutral-300 dark:border-neutral-700"}`}>
                                    {km}km
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setNearOpen(false)} className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">확인</button>
                            <button onClick={() => set({ near: undefined, sort: "popular" })} className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">해제</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={enableNear} className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">내 주변 활성화</button>
                )}
            </DrawerPortal>
        </div>
    );
}
