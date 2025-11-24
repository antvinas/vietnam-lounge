// src/pages/Events/EventList.tsx
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Placeholder from "@/components/common/Placeholder";

/**
 * 접근 가능한 필터 UI:
 * - 도시: ARIA Combobox(role="combobox" + popup listbox)
 * - 카테고리: ARIA Listbox(role="listbox")
 * - 키보드 탐색, 레이블 연결, aria-selected 적용
 * - 빈 상태 메시지와 "필터 초기화" 제공
 */

type EventItem = {
  id: string;
  title: string;
  city: string;
  category: string;
  date: string; // ISO YYYY-MM-DD
};

const ALL_CITIES = ["Hanoi", "Ho Chi Minh City", "Da Nang", "Nha Trang", "Phu Quoc"];
const ALL_CATEGORIES = ["Festival", "Tour", "Food", "Music", "Nightlife"];

// 데모 데이터(백엔드 제외 요구에 맞춰 프런트 필터만 구현)
const SEED: EventItem[] = [
  { id: "1", title: "Tet Street Parade", city: "Ho Chi Minh City", category: "Festival", date: "2025-02-15" },
  { id: "2", title: "Phu Quoc Snorkeling", city: "Phu Quoc", category: "Tour", date: "2025-02-18" },
  { id: "3", title: "Hanoi Food Walk", city: "Hanoi", category: "Food", date: "2025-03-01" },
];

function srOnly(cls = "") {
  return `absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 ${cls}`;
}

/** Combobox: 도시 */
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
      <label htmlFor={inputId} className="block text-sm font-medium text-text-main">
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
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
      />

      {open && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-surface shadow-card"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-secondary">검색 결과 없음</li>
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
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    focused ? "bg-background-sub" : ""
                  } ${selected ? "font-semibold text-primary" : ""}`}
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

/** Listbox: 카테고리 */
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
      <div className="block text-sm font-medium text-text-main">{label}</div>
      <ul
        id={listId}
        role="listbox"
        tabIndex={0}
        aria-label="카테고리 선택"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
        className="mt-1 grid grid-cols-2 gap-2"
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
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                selected ? "border-primary text-primary" : "border-border"
              } ${focused ? "ring-2 ring-primary/40" : ""}`}
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

export default function EventList() {
  const [city, setCity] = useState<string>("");
  const [category, setCategory] = useState<string | null>(null);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const results = useMemo(() => {
    return SEED.filter((ev) => {
      if (city && ev.city !== city) return false;
      if (category && ev.category !== category) return false;
      if (from && ev.date < from) return false;
      if (to && ev.date > to) return false;
      return true;
    });
  }, [city, category, from, to]);

  const clearFilters = () => {
    setCity("");
    setCategory(null);
    setFrom("");
    setTo("");
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold">예정된 이벤트</h1>

      {/* 필터 패널 */}
      <form className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-4 md:grid-cols-4">
        <CityCombobox
          value={city}
          onChange={setCity}
          label="도시"
          placeholder="도시를 입력하세요"
        />
        <CategoryListbox value={category} onChange={setCategory} label="카테고리" />

        <div>
          <label htmlFor="from" className="block text-sm font-medium text-text-main">
            시작일
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-text-main">
            종료일
          </label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>

        <div className="col-span-full mt-1 flex items-center justify-between">
          <div aria-live="polite" className={srOnly()}>
            필터 결과 {results.length}건
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-border px-3 py-2 text-sm"
            aria-label="필터 초기화"
          >
            필터 초기화
          </button>
        </div>
      </form>

      {/* 결과 영역 */}
      {results.length === 0 ? (
        <div className="mt-6">
          <Placeholder
            title="일치하는 이벤트가 없습니다"
            message="필터를 조정하거나 초기화해 다시 시도하세요."
          />
          <div className="mt-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
            >
              필터 초기화
            </button>
          </div>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3" role="list">
          {results.map((ev) => (
            <li key={ev.id} role="listitem" className="rounded-xl border border-border p-4">
              <h3 className="text-lg font-semibold">{ev.title}</h3>
              <p className="text-sm text-text-secondary">
                {ev.city} · {ev.category} · {ev.date}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
