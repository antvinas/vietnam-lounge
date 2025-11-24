import React from "react";

/**
 * 맵 토글의 "더 보기" 드롭다운.
 * - 접근성: 버튼은 aria-haspopup="menu", 메뉴는 role="menu"
 * - 항목은 role="menuitemcheckbox" + aria-checked
 * - ESC/바깥클릭 닫기, 키보드 ↑/↓/Home/End 이동, Enter/Space 토글
 * - 포커스 복귀(버튼) 보장
 */
export type MoreMenuItem = {
  key: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export default function MapToolbarMoreMenu({
  items,
  className,
  label = "더 보기",
}: {
  items: MoreMenuItem[];
  className?: string;
  label?: string;
}) {
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const ids = React.useMemo(
    () => ({
      btn: `mtm-btn-${Math.random().toString(36).slice(2, 8)}`,
      menu: `mtm-menu-${Math.random().toString(36).slice(2, 8)}`,
    }),
    []
  );

  // 닫을 때 포커스 복귀
  React.useEffect(() => {
    if (!open && btnRef.current) btnRef.current.focus();
  }, [open]);

  // 바깥 클릭 닫기
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current || !btnRef.current) return;
      const t = e.target as Node;
      if (!menuRef.current.contains(t) && !btnRef.current.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggleOpen = () => setOpen((v) => !v);

  const focusItem = (i: number) => {
    const node = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]')[i];
    node?.focus();
    setActiveIndex(i);
  };

  const onButtonKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => focusItem(0), 0);
    }
  };

  const onMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const last = items.length - 1;
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); focusItem(Math.min(last, activeIndex + 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); focusItem(Math.max(0, activeIndex - 1)); return; }
    if (e.key === "Home") { e.preventDefault(); focusItem(0); return; }
    if (e.key === "End") { e.preventDefault(); focusItem(last); return; }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const cur = items[activeIndex];
      if (!cur?.disabled) cur.onChange(!cur.checked);
      return;
    }
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        id={ids.btn}
        ref={btnRef}
        type="button"
        className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={ids.menu}
        onClick={toggleOpen}
        onKeyDown={onButtonKeyDown}
      >
        ⋯ {label}
      </button>

      {open && (
        <div
          id={ids.menu}
          ref={menuRef}
          role="menu"
          aria-labelledby={ids.btn}
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          onKeyDown={onMenuKeyDown}
        >
          {items.map((it, idx) => (
            <button
              key={it.key}
              role="menuitemcheckbox"
              aria-checked={!!it.checked}
              disabled={it.disabled}
              tabIndex={idx === 0 ? 0 : -1}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm outline-none
                ${it.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-800"}
              `}
              onClick={() => !it.disabled && it.onChange(!it.checked)}
              onFocus={() => setActiveIndex(idx)}
            >
              <span className="truncate">{it.label}</span>
              <span aria-hidden="true" className="ml-2 text-slate-500">
                {it.checked ? "✔" : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
