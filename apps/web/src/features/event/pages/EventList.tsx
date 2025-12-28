// apps/web/src/features/event/pages/EventList.tsx

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useModeStore from "@/store/mode.store"; // (수정됨 1) 중괄호 {} 제거 (export default 이므로)
import Placeholder from "@/components/common/Placeholder";
import { getEvents } from "../api/events.api";
import EventCard from "../components/EventCard";
import { Event } from "@/types/event";

const ALL_CITIES = ["Hanoi", "Ho Chi Minh City", "Da Nang", "Nha Trang", "Phu Quoc"];
const ALL_CATEGORIES = ["Festival", "Tour", "Food", "Music", "Nightlife"];

function srOnly(cls = "") {
  return `absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 ${cls}`;
}

function CityCombobox({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
}) {
  const id = useId();
  const inputId = `${id}-city-input`;
  const listId = `${id}-city-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => setQuery(value), [value]);

  const commit = (next: string) => {
    onChange(next);
    setQuery(next);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.setSelectionRange(next.length, next.length);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      setActiveIndex(0);
      e.preventDefault();
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActiveIndex((i) => Math.max(i - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && filtered[activeIndex]) {
        commit(filtered[activeIndex]);
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      e.preventDefault();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const activeId = activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeId}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
      />

      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">검색 결과 없음</li>
          ) : (
            filtered.map((opt, i) => {
              const selected = opt === value;
              const focused = i === activeIndex;
              return (
                <li
                  id={`${listId}-opt-${i}`}
                  key={opt}
                  role="option"
                  aria-selected={selected}
                  className={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                    focused ? "bg-gray-100 dark:bg-gray-700" : ""
                  } ${selected ? "font-semibold text-blue-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  {opt}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

function CategoryListbox({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
}) {
  const id = useId();
  const listId = `${id}-cat-list`;
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const all = useMemo(() => ["All", ...ALL_CATEGORIES], []);
  const selectedIndex = value ? all.findIndex((x) => x === value) : 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") {
      setActiveIndex((i) => Math.min((i < 0 ? selectedIndex : i) + 1, all.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActiveIndex((i) => Math.max((i < 0 ? selectedIndex : i) - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      const idx = activeIndex < 0 ? selectedIndex : activeIndex;
      const val = all[idx];
      onChange(val === "All" ? null : val);
      e.preventDefault();
    }
  };

  return (
    <div>
      <div className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <ul
        id={listId}
        role="listbox"
        tabIndex={0}
        aria-label="카테고리 선택"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
        className="mt-1 flex flex-wrap gap-2"
        onKeyDown={onKeyDown}
      >
        {all.map((opt, i) => {
          const selected = opt === (value ?? "All");
          const focused = i === activeIndex;
          
          return (
            <li
              id={`${listId}-opt-${i}`}
              key={opt}
              role="option"
              aria-selected={selected}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                selected
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-purple-500 dark:bg-purple-900/30 dark:text-purple-300"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500"
              } ${focused ? "ring-2 ring-blue-500/40 dark:ring-purple-500/40" : ""}`}
              onClick={() => onChange(opt === "All" ? null : opt)}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {opt}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------------
// 메인 EventList 페이지
// ----------------------------------------------------------------------

export default function EventList() {
  // (수정됨 2) 기존 isNightMode -> nightlifeEntered (보내주신 스토어 변수명 사용)
  const { nightlifeEntered } = useModeStore(); 

  // 편의를 위해 내부에서 변수명을 맞춰줍니다.
  const isNightMode = nightlifeEntered; 

  const { data: events = [], isLoading, isError } = useQuery<Event[]>({
    queryKey: ["events", isNightMode], 
    queryFn: () => getEvents(isNightMode),
  });

  const [city, setCity] = useState<string>("");
  const [category, setCategory] = useState<string | null>(null);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const results = useMemo(() => {
    return events.filter((ev) => {
      if (city && ev.city !== city) return false;
      if (category && ev.category !== category) return false;
      if (from && ev.date < from) return false;
      if (to && ev.date > to) return false;
      return true;
    });
  }, [city, category, from, to, events]);

  const clearFilters = () => {
    setCity("");
    setCategory(null);
    setFrom("");
    setTo("");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-purple-500"></div>
        <p className="text-gray-500 dark:text-gray-400">이벤트를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          데이터를 가져오는데 실패했습니다.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700"
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* 상단 Hero Section */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-5xl">
          {isNightMode ? "🌙 Nightlife Events" : "☀️ Upcoming Events"}
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
          {isNightMode 
            ? "베트남의 밤을 뜨겁게 달구는 최고의 파티와 이벤트를 만나보세요." 
            : "베트남 여행의 즐거움을 더해줄 다채로운 축제와 행사를 확인하세요."}
        </p>
      </div>

      {/* 필터 패널 */}
      <form className="mb-8 grid grid-cols-1 gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:grid-cols-2 lg:grid-cols-4">
        <CityCombobox
          value={city}
          onChange={setCity}
          label="도시"
          placeholder="도시 검색 (예: Hanoi)"
        />
        <CategoryListbox value={category} onChange={setCategory} label="카테고리" />
        <div>
          <label htmlFor="from" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            시작일
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
          />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            종료일
          </label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500/20"
          />
        </div>
        <div className="col-span-full mt-2 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
          <div aria-live="polite" className={srOnly()}>
            필터 결과 {results.length}건
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            총 <strong className="text-gray-900 dark:text-white">{results.length}</strong>개의 이벤트
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white"
            aria-label="필터 초기화"
          >
            필터 초기화
          </button>
        </div>
      </form>

      {/* 결과 영역 */}
      {results.length === 0 ? (
        <div className="mt-12">
          <Placeholder
            title="조건에 맞는 이벤트가 없습니다"
            message="필터를 조정하거나 초기화해 다시 시도하세요."
          />
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((ev) => (
            <li key={ev.id}>
              <EventCard event={ev} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}