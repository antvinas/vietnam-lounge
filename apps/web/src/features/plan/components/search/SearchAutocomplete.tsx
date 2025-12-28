// src/components/plan/SearchAutocomplete.tsx

/* 포털 기반 콤보박스 — 입력 텍스트 깨짐 방지용 .text-keep 적용 */
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getComboboxProps,
  getListboxProps,
  getOptionProps,
  moveIndex,
} from "@/utils/a11y/combobox";

function ensurePortalRoot(id = "vnl-portal-root") {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}

export type AutocompleteItem = {
  id?: string;
  primary: string;
  secondary?: string;
  raw?: any;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  onSelect?: (item: AutocompleteItem) => void;
  suggestions?: AutocompleteItem[];
  loading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  onSelect,
  suggestions = [],
  loading = false,
  placeholder = "장소·음식점·카페 검색 (예: 푸꾸옥 카페)",
  autoFocus,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const expanded = open && (loading || suggestions.length > 0);
  const canSubmit = value.trim().length > 0;
  const clamped =
    suggestions.length === 0
      ? -1
      : Math.min(active, suggestions.length - 1);
  const listboxId = "search-ac-listbox";
  const activeId = useMemo(
    () => (clamped >= 0 ? `ac-opt-${clamped}` : undefined),
    [clamped]
  );

  const [rect, setRect] = useState<DOMRect | null>(null);
  const recalc = () => {
    const el = rootRef.current;
    if (!el) return;
    setRect(el.getBoundingClientRect());
  };

  useEffect(() => {
    recalc();
    const onScroll = () => recalc();
    const onResize = () => recalc();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    setOpen(!!(loading || suggestions.length > 0));
  }, [loading, suggestions.length]);

  const selectIdx = (i: number) => {
    if (i >= 0 && i < suggestions.length) onSelect?.(suggestions[i]);
  };

  return (
    <div className={className} ref={rootRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit?.(value.trim());
        }}
        className="flex items-center gap-2"
      >
        <input
          ref={inputRef}
          {...getComboboxProps({
            expanded,
            activeId,
            listboxId,
            autocomplete: "list",
          })}
          value={value}
          onFocus={() => setOpen(true)}
          onBlur={() =>
            requestAnimationFrame(() => {
              const el =
                (document.activeElement as HTMLElement | null) || null;
              const inPortal = el && el.closest?.("#vnl-portal-root");
              if (!inPortal) setOpen(false);
            })
          }
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (!expanded) return;
            if (
              ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)
            ) {
              e.preventDefault();
              setActive((v) =>
                moveIndex(
                  suggestions.length,
                  v < 0 ? 0 : v,
                  e.key as any
                )
              );
            } else if (e.key === "Enter" && clamped >= 0) {
              e.preventDefault();
              selectIdx(clamped);
            } else if (e.key === "Escape") {
              e.preventDefault();
              setActive(-1);
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="장소 자동완성 검색"
          className="text-keep w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-[13px] text-neutral-50 placeholder:text-neutral-400 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 md:text-sm"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-emerald whitespace-nowrap px-3 py-2 text-[13px] md:text-sm disabled:opacity-50"
        >
          검색
        </button>
      </form>

      {expanded &&
        rect &&
        createPortal(
          <div
            className="ac-popover-portal rounded-md border border-neutral-700 bg-neutral-900/95 p-1 shadow-lg backdrop-blur"
            style={{
              left: rect.left,
              top: rect.bottom + 8,
              width: rect.width,
            }}
            {...getListboxProps(listboxId, false)}
            role="listbox"
          >
            {loading && (
              <div className="row px-2 py-2 text-xs text-neutral-400">
                불러오는 중…
              </div>
            )}
            {!loading &&
              suggestions.map((s, i) => {
                const id = `ac-opt-${i}`;
                const selected = i === clamped;
                return (
                  <button
                    key={s.id ?? s.primary + s.secondary}
                    {...getOptionProps(id, selected)}
                    className={`row w-full rounded-md px-2 py-1.5 text-left ${
                      selected
                        ? "bg-neutral-800 text-neutral-50"
                        : "text-neutral-100 hover:bg-neutral-800/70"
                    }`}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      selectIdx(i);
                      setOpen(false);
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="text-keep line-clamp-1 text-[13px]">
                      {s.primary}
                    </div>
                    {s.secondary && (
                      <div className="text-keep line-clamp-1 text-[11px] text-neutral-400">
                        {s.secondary}
                      </div>
                    )}
                  </button>
                );
              })}
          </div>,
          ensurePortalRoot()
        )}
    </div>
  );
}

export default memo(SearchAutocomplete);
