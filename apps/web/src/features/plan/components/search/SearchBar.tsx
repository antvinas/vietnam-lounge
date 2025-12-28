// src/components/plan/SearchBar.tsx

import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 간단 검색 바.
 * - Submit 시 /plan/editor 로 이동 보장 (검색어가 있을 때만)
 */
type Props = {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (q: string) => void;
  className?: string;
};

export default function SearchBar({
  placeholder = "장소·카페·호텔 이름을 입력하세요",
  defaultValue = "",
  onSearch,
  className,
}: Props) {
  const [q, setQ] = useState(defaultValue);
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      return;
    }
    onSearch?.(query);
    navigate("/plan/editor");
  };

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* 검색 아이콘 */}
        <span
          aria-hidden="true"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-slate-400 dark:text-slate-500"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4"
            focusable="false"
          >
            <path
              d="M13.5 12.5L17 16m-2.5-6.5A5.5 5.5 0 1 1 4 4a5.5 5.5 0 0 1 10.5 5.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-50 dark:placeholder:text-slate-500 md:text-sm"
          aria-label="장소 검색어"
        />

        <button
          type="submit"
          disabled={!q.trim()}
          className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-600/50 md:text-sm"
          aria-label="검색"
        >
          검색
        </button>
      </div>
    </form>
  );
}
