// src/components/plan/ContextMenu.tsx
import React, { useEffect, useRef, useState } from "react";
import { t } from "@/features/plan/locales/strings";

export type MenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type Props = {
  open: boolean;
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
  locale?: "ko" | "en";
};

const LOCALE_DEFAULT: "ko" = "ko";

/**
 * 키보드 경로:
 * - ArrowUp/ArrowDown: 항목 이동(라핑)
 * - Enter/Space: 활성 선택
 * - Escape: 닫고 트리거 포커스 복원
 * APG 권고 동작을 따릅니다.
 */
export default function ContextMenu({ open, x, y, items, onClose, locale = LOCALE_DEFAULT }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;

    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        // 포커스 복원
        lastFocus.current?.focus?.();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);

    // 첫 포커스
    setTimeout(() => btnRefs.current[0]?.focus?.(), 0);

    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const allEnabledIdx = items.findIndex((i) => !i.disabled);
  const count = items.length;

  const onMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (activeIdx + 1) % count;
      setActiveIdx(next);
      btnRefs.current[next]?.focus?.();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = (activeIdx - 1 + count) % count;
      setActiveIdx(next);
      btnRefs.current[next]?.focus?.();
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIdx(0);
      btnRefs.current[0]?.focus?.();
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIdx(count - 1);
      btnRefs.current[count - 1]?.focus?.();
    }
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={t(locale, "a11y", "contextMenuLabel")}
      onKeyDown={onMenuKeyDown}
      style={{
        position: "fixed",
        left: x,
        top: y,
        minWidth: 200,
        background: "rgba(14,17,24,0.98)",
        color: "white",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        boxShadow: "0 10px 15px rgba(0,0,0,0.25)",
        padding: 6,
        zIndex: 10000,
      }}
    >
      {items.map((it, idx) => (
        <button
          key={idx}
          ref={(el) => (btnRefs.current[idx] = el)}
          role="menuitem"
          disabled={it.disabled}
          onClick={() => {
            if (!it.disabled) it.onClick();
            onClose();
            lastFocus.current?.focus?.();
          }}
          tabIndex={idx === (allEnabledIdx === -1 ? 0 : activeIdx) ? 0 : -1}
          style={{
            width: "100%",
            textAlign: "left",
            border: "none",
            background: "transparent",
            color: it.danger ? "#FCA5A5" : "white",
            opacity: it.disabled ? 0.5 : 1,
            padding: "10px 12px",
            borderRadius: 8,
            cursor: it.disabled ? "not-allowed" : "pointer",
            outlineOffset: 2,
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
