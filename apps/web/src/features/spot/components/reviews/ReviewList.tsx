// src/features/spot/components/reviews/ReviewList.tsx

import React, { useMemo, useState } from "react";
import type { SpotReview } from "@/types/spot";
import RatingSummary, { RatingBreakdown } from "@/features/spot/components/reviews/RatingSummary";

type Props = {
  reviews: SpotReview[];
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[1,2,3,4,5].map((i) => (
        <span key={i} className={i <= n ? "text-emerald-300" : "text-slate-600"}>★</span>
      ))}
    </div>
  );
}

export default function ReviewList({ reviews, className = "", onLoadMore, hasMore }: Props) {
  const [starFilter, setStarFilter] = useState<1|2|3|4|5|0>(0);
  const [sort, setSort] = useState<"latest"|"highest"|"lowest">("latest");

  const total = reviews.length;
  const average = total ? reviews.reduce((s, r: any) => s + (r.rating || 0), 0) / total : 0;

  const breakdown: RatingBreakdown = useMemo(() => {
    const map: any = {1:0,2:0,3:0,4:0,5:0};
    reviews.forEach((r: any) => { const k = Math.round(r.rating || 0); if (k>=1 && k<=5) map[k]++; });
    return map;
  }, [reviews]);

  const filtered = useMemo(() => {
    let arr = [...reviews];
    if (starFilter) arr = arr.filter((r: any) => Math.round(r.rating || 0) === starFilter);
    if (sort === "latest") arr.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    if (sort === "highest") arr.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    if (sort === "lowest") arr.sort((a: any, b: any) => (a.rating || 0) - (b.rating || 0));
    return arr;
  }, [reviews, starFilter, sort]);

  return (
    <section className={`space-y-4 ${className}`}>
      <RatingSummary
        average={average}
        total={total}
        breakdown={breakdown}
        onFilterByStar={(s) => setStarFilter((prev) => (prev === s ? 0 : s))}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {starFilter ? `${starFilter}점만 보기` : "전체"} · {filtered.length}개
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-sm text-slate-200"
          aria-label="정렬"
        >
          <option value="latest">최신순</option>
          <option value="highest">평점 높은순</option>
          <option value="lowest">평점 낮은순</option>
        </select>
      </div>

      <ul className="space-y-3">
        {filtered.map((r: any, idx) => (
          <li key={r.id || idx} className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Stars n={Math.round(r.rating || 0)} />
                  <span className="text-xs text-slate-400">
                    {(r.createdAt && new Date(r.createdAt).toLocaleDateString()) || ""}
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium text-slate-200">
                  {(r.nickname as string) || "익명"}
                </div>
              </div>
            </div>

            {r.content && (
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-200">
                {r.content}
              </p>
            )}

            {Array.isArray((r as any).photos) && (r as any).photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(r as any).photos.slice(0, 8).map((src: string, i: number) => (
                  <img
                    key={i}
                    src={src}
                    alt={`리뷰 사진 ${i + 1}`}
                    className="h-24 w-full rounded-lg object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full rounded-xl bg-slate-700/70 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
          >
            더 보기
          </button>
        </div>
      )}
    </section>
  );
}
