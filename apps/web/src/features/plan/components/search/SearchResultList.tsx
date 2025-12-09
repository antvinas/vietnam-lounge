// src/components/plan/SearchResultList.tsx

import React from "react";

export type Item = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  photoUrl?: string;
  distanceKm?: number;
  etaMin?: number;
  /** 선택: 카테고리 (예: '카페', '관광지') */
  category?: string;
  /** 선택: 태그 (예: ['커피', '뷰맛집']) */
  tags?: string[];
};

type Props = {
  items: Item[];
  origin?: { lat: number; lng: number } | null;
  onAdd?: (p: Item) => void;
  onAddToDay?: (p: Item, dayIndex?: number) => void;
  onDirections?: (p: Item) => void;
  onSetStart?: (p: Item) => void;
  onSetEnd?: (p: Item) => void;
};

export default function SearchResultList({
  items,
  onAdd,
  onAddToDay,
  onDirections,
  onSetStart,
  onSetEnd,
}: Props) {
  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-slate-300/60 bg-white/60 p-4 text-center text-sm text-slate-500 dark:border-slate-600/50 dark:bg-slate-900/60 dark:text-slate-400">
        검색 결과가 없습니다.
      </div>
    );
  }

  return (
    // 전역 break-all·vertical 글줄을 강제로 무력화
    <div className="vnl-reset">
      <ul className="search-result-list">
        {items.map((p) => {
          const tags = p.tags?.slice(0, 3) ?? [];
          return (
            <li
              key={p.id}
              className="search-result-card"
              tabIndex={0}
            >
              <div className="flex gap-3">
                {/* 썸네일: 고정 박스 + object-fit cover */}
                <div className="search-result-thumb">
                  <img
                    src={
                      p.photoUrl ||
                      "https://picsum.photos/seed/vnl/128/128"
                    }
                    alt=""
                    className="search-result-thumb-img"
                    width={64}
                    height={64}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {/* 상단: 제목 + 거리/시간/평점 메타 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="search-result-title">
                        {p.name}
                      </h3>
                      {p.address && (
                        <p className="search-result-address">
                          {p.address}
                        </p>
                      )}
                    </div>

                    <div className="search-result-meta">
                      {typeof p.distanceKm === "number" && (
                        <span className="search-result-meta-badge">
                          {p.distanceKm.toFixed(1)} km
                        </span>
                      )}
                      {typeof p.etaMin === "number" && (
                        <span className="search-result-meta-badge">
                          {p.etaMin} 분
                        </span>
                      )}
                      {typeof p.rating === "number" && (
                        <span className="search-result-meta-badge rating">
                          ★ {p.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 카테고리/태그 */}
                  {(p.category || tags.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {p.category && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                          {p.category}
                        </span>
                      )}
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 액션: 가로 칩, 수축 금지 */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {onAdd && (
                      <button
                        type="button"
                        className="search-result-action primary"
                        onClick={() => onAdd(p)}
                      >
                        일정에 추가
                      </button>
                    )}
                    {onAddToDay && (
                      <button
                        type="button"
                        className="search-result-action"
                        onClick={() => onAddToDay(p, undefined)}
                      >
                        Day 선택 추가
                      </button>
                    )}
                    {onSetStart && (
                      <button
                        type="button"
                        className="search-result-action subtle"
                        onClick={() => onSetStart(p)}
                      >
                        출발지
                      </button>
                    )}
                    {onSetEnd && (
                      <button
                        type="button"
                        className="search-result-action subtle"
                        onClick={() => onSetEnd(p)}
                      >
                        도착지
                      </button>
                    )}
                    {onDirections && (
                      <button
                        type="button"
                        className="search-result-link"
                        onClick={() => onDirections(p)}
                      >
                        지도에서 보기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
