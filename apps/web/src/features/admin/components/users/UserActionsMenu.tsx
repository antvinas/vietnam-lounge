// apps/web/src/features/admin/components/users/UserActionsMenu.tsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  userId: string;
  isSuperAdmin?: boolean;
  status: "active" | "banned";

  onOpen: () => void;
  onRequestRoleChange: () => void;

  onActivate: () => void;
  onBan: () => void;
  onDelete: () => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function UserActionsMenu({
  isSuperAdmin,
  status,
  onOpen,
  onRequestRoleChange,
  onActivate,
  onBan,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const statusLabel = useMemo(() => (status === "banned" ? "활성화" : "차단"), [status]);

  const close = () => setOpen(false);

  const computePos = () => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const width = 176; // w-44
    const gap = 8;

    const left = clamp(rect.right - width, 8, window.innerWidth - width - 8);
    const top = clamp(rect.bottom + gap, 8, window.innerHeight - 8);

    setPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    computePos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      close();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const onReposition = () => computePos();

    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="inline-block text-left">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-600"
        aria-label="사용자 작업 메뉴"
        type="button"
      >
        ⋯
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
              className="origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 z-[9999] overflow-hidden"
            >
              <button
                onClick={() => {
                  close();
                  onOpen();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                type="button"
              >
                상세 보기
              </button>

              <button
                onClick={() => {
                  close();
                  if (isSuperAdmin) return;
                  onRequestRoleChange();
                }}
                disabled={!!isSuperAdmin}
                className={[
                  "w-full text-left px-3 py-2 text-sm",
                  isSuperAdmin ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-50",
                ].join(" ")}
                type="button"
              >
                권한 변경
              </button>

              <button
                onClick={() => {
                  close();
                  status === "banned" ? onActivate() : onBan();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                type="button"
              >
                {statusLabel}
              </button>

              <div className="h-px bg-gray-100" />

              <button
                onClick={() => {
                  close();
                  if (isSuperAdmin) return;
                  onDelete();
                }}
                disabled={!!isSuperAdmin}
                className={[
                  "w-full text-left px-3 py-2 text-sm",
                  isSuperAdmin ? "text-gray-300 cursor-not-allowed" : "text-red-600 hover:bg-red-50",
                ].join(" ")}
                type="button"
              >
                삭제(위험)
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
