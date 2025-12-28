import React from "react";

export type VisibilityFilter = "all" | "public" | "private";

type Props = {
  open: boolean;
  onToggle: () => void;

  rangeStart: string; // YYYY-MM-DD or ""
  rangeEnd: string; // YYYY-MM-DD or ""
  city: string; // "" means all
  visibility: VisibilityFilter;

  cityOptions: string[];

  onChange: (patch: {
    rangeStart?: string;
    rangeEnd?: string;
    city?: string;
    visibility?: VisibilityFilter;
  }) => void;

  onReset: () => void;
};

export default function EventAdvancedFilters({
  open,
  onToggle,
  rangeStart,
  rangeEnd,
  city,
  visibility,
  cityOptions,
  onChange,
  onReset,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-extrabold text-gray-900">고급 필터</div>
          <div className="text-xs text-gray-500 mt-0.5">
            기간/도시/공개 여부를 URL에 저장해서 공유·북마크가 가능합니다.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-extrabold"
            aria-expanded={open}
          >
            {open ? "닫기" : "열기"}
          </button>
        </div>
      </div>

      <div
        className={[
          "transition-all duration-200 ease-out",
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">기간 시작</label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => onChange({ rangeStart: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">기간 종료</label>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => onChange({ rangeEnd: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">도시</label>
            <select
              value={city}
              onChange={(e) => onChange({ city: e.target.value })}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none"
            >
              <option value="">전체</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">공개 여부</label>
            <select
              value={visibility}
              onChange={(e) => onChange({ visibility: e.target.value as VisibilityFilter })}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none"
            >
              <option value="all">전체</option>
              <option value="public">공개</option>
              <option value="private">비공개</option>
            </select>
            <div className="text-[11px] text-gray-500 mt-1">
              * 이벤트 문서에 <span className="font-mono">isPublic</span> 필드가 있을 때만 정확히 필터링됩니다.
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            팁: 기간은 “이벤트 기간과 겹치는 것” 기준으로 필터됩니다. (시작~종료 span)
          </div>
        </div>
      </div>
    </div>
  );
}
