import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaCopy, FaClone, FaEdit, FaTrash } from "react-icons/fa";

type Props = {
  editTo: string;
  onDuplicate: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
  disabled?: boolean;

  /** ✅ 삭제 confirm 강화용(이벤트명/날짜 등) */
  deleteConfirmTitle?: string; // 예: "Danang International Fireworks Festival"
  deleteConfirmMeta?: string; // 예: "2024-06-08(토) ~ 2024-06-09(일)"
};

export default function EventRowActions({
  editTo,
  onDuplicate,
  onCopyLink,
  onDelete,
  disabled,
  deleteConfirmTitle,
  deleteConfirmMeta,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        btnRef.current?.focus?.();
      }
    };

    document.addEventListener("mousedown", onDocMouseDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const itemCls =
    "w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50";

  const confirmAndDelete = () => {
    const title = String(deleteConfirmTitle || "").trim();
    const meta = String(deleteConfirmMeta || "").trim();

    // ✅ 관리자 실수 방지: 이벤트명+날짜 포함 confirm
    const msg =
      title || meta
        ? `정말 삭제할까요?\n\n${title ? `• ${title}\n` : ""}${meta ? `• ${meta}\n` : ""}\n삭제하면 복구가 어려울 수 있습니다.`
        : "정말 삭제할까요?\n삭제하면 복구가 어려울 수 있습니다.";

    const ok = window.confirm(msg);
    if (!ok) return;

    onDelete();
  };

  return (
    <div
      ref={rootRef}
      className="relative inline-flex justify-end"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        ref={btnRef}
        type="button"
        className="admin-action-btn inline-flex items-center justify-center w-10 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-extrabold"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title="작업"
      >
        ⋯
      </button>

      {open ? (
        <div
          className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-gray-200 bg-white shadow-lg p-1"
          role="menu"
          aria-label="이벤트 행 작업 메뉴"
        >
          <Link to={editTo} className={itemCls} role="menuitem" onClick={() => setOpen(false)}>
            <FaEdit className="opacity-80" /> 수정
          </Link>

          <button
            type="button"
            className={itemCls}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
          >
            <FaClone className="opacity-80" /> 복제
          </button>

          <button
            type="button"
            className={itemCls}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onCopyLink();
            }}
          >
            <FaCopy className="opacity-80" /> 링크 복사
          </button>

          <div className="my-1 h-px bg-gray-100" />

          <button
            type="button"
            className={[itemCls, "text-red-700 hover:bg-red-50"].join(" ")}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              confirmAndDelete();
            }}
          >
            <FaTrash className="opacity-90" /> 삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}
