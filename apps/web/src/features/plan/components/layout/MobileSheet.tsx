import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Snap = "small" | "medium" | "large";

export interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  initialSnap?: Snap;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** 시트 루트 id (선택) */
  portalId?: string;
}

const snapToVH: Record<Snap, string> = {
  small: "35vh",
  medium: "65vh",
  large: "85vh",
};

export default function MobileSheet({
  open,
  onClose,
  title,
  initialSnap = "medium",
  footer,
  children,
  portalId = "portal-root",
}: MobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // ESC/바깥 클릭 닫기 + 포커스 트랩
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const el = sheetRef.current;
        if (!el) return;
        const f = el.querySelectorAll<HTMLElement>(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          (last as HTMLElement).focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          (first as HTMLElement).focus();
          e.preventDefault();
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const backdrop = document.getElementById("mobile-sheet-backdrop");
      if (target === backdrop) onClose();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    // 초기 포커스
    setTimeout(() => {
      const h = sheetRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? sheetRef.current;
      h?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const body = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Panel"}
      className="fixed inset-0 z-[60] lg:hidden"
    >
      <div
        id="mobile-sheet-backdrop"
        className="absolute inset-0 bg-black/40"
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-2xl ring-1 ring-black/10 outline-none dark:bg-gray-900 dark:ring-white/10"
        style={{ height: snapToVH[initialSnap] }}
      >
        <div className="flex items-center justify-center py-2">
          <span
            aria-hidden="true"
            className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700"
          />
        </div>
        {title && (
          <div className="px-4 pb-2 text-base font-semibold">{title}</div>
        )}
        <div className="h-full overflow-y-auto px-2 pb-24">{children}</div>
        {footer && (
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 border-t bg-white/90 p-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  const portal = document.getElementById(portalId);
  return portal ? createPortal(body, portal) : body;
}
