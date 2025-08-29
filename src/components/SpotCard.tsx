// src/components/SpotCard.tsx
import { Star, MapPin, Heart } from "lucide-react";
import type { Spot } from "@/lib/spots";
import { useState } from "react";

export default function SpotCard({ s }: { s: Spot }) {
    const [liked, setLiked] = useState(false);
    return (
        <div className="group relative rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:shadow-md transition">
            {/* 썸네일 */}
            <div className="relative aspect-video">
                <img
                    src={s.coverImage || "/placeholder.jpg"}
                    alt={s.name}
                    width={960}
                    height={540}
                    className="h-full w-full object-cover group-hover:scale-[1.02] transition"
                    loading="lazy"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                    {s.openNow ? (
                        <span className="text-xs rounded-full bg-emerald-600 text-white px-2 py-1">영업중</span>
                    ) : s.closingTimeText ? (
                        <span className="text-xs rounded-full bg-amber-600 text-white px-2 py-1">{s.closingTimeText}</span>
                    ) : null}
                    {s.distanceKm !== undefined && (
                        <span className="text-xs rounded-full bg-black/60 text-white px-2 py-1 backdrop-blur">
                            {s.distanceKm.toFixed(1)}km
                        </span>
                    )}
                </div>
                <button
                    aria-label="저장"
                    onClick={() => setLiked(v => !v)}
                    className="absolute right-3 bottom-3 p-2 rounded-full bg-black/45 backdrop-blur hover:bg-black/70"
                >
                    <Heart className={`h-5 w-5 ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
                </button>
            </div>

            {/* 본문 */}
            <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-neutral-900 dark:text-neutral-100 font-semibold line-clamp-1">{s.name}</h3>
                    <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-amber-400" />
                        <span className="text-neutral-900 dark:text-neutral-100">{s.rating?.toFixed(1) ?? "-"}</span>
                        <span className="text-neutral-500 dark:text-neutral-400">({s.reviewsCount ?? 0})</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-400">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{s.city ?? ""}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {s.categories?.slice(0, 2).map((c) => (
                        <span key={c} className="text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1">
                            {c}
                        </span>
                    ))}
                    {!!s.priceLevel && (
                        <span className="text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1">
                            ₫{Array.from({ length: s.priceLevel }).map(() => "₫").join("")}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
