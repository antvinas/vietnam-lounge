// apps/web/src/components/common/StickyActionsBar.tsx
import React from "react";
import { FaPhoneAlt, FaLocationArrow, FaHeart } from "react-icons/fa";

type SpotVariantProps = {
  variant?: "spot";
  onCall?: () => void;
  onNavigate?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
};

type AdminActionTone = "primary" | "secondary" | "danger";

type AdminAction = {
  key: string;
  label: string;
  onClick: () => void;
  tone?: AdminActionTone;
  disabled?: boolean;
};

type AdminVariantProps = {
  variant: "admin";
  title?: string;
  subtitle?: string;
  dirty?: boolean;
  loading?: boolean;
  actions: AdminAction[];
};

type Props = SpotVariantProps | AdminVariantProps;

export default function StickyActionsBar(props: Props) {
  // ✅ Admin variant (상단 고정 저장바)
  if ((props as any).variant === "admin") {
    const p = props as AdminVariantProps;

    const toneClass = (tone?: AdminActionTone) => {
      if (tone === "danger") return "bg-red-600 text-white hover:bg-red-700";
      if (tone === "secondary") return "bg-white text-black border hover:bg-gray-50";
      return "bg-black text-white hover:bg-black/90";
    };

    return (
      <div className="sticky top-0 z-40 -mx-4 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate text-base font-semibold">{p.title || "편집"}</div>
              {p.loading ? (
                <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">저장중…</span>
              ) : p.dirty ? (
                <span className="rounded-full border px-2 py-0.5 text-xs">변경됨</span>
              ) : (
                <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">저장됨</span>
              )}
            </div>
            {p.subtitle && <div className="truncate text-xs text-muted-foreground">{p.subtitle}</div>}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {p.actions.map((a) => (
              <button
                key={a.key}
                type="button"
                disabled={!!a.disabled}
                onClick={a.onClick}
                className={[
                  "h-9 rounded-md px-3 text-sm",
                  a.tone === "secondary" ? "border" : "",
                  toneClass(a.tone),
                  a.disabled ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ✅ 기존 Spot variant(모바일 하단 액션바) — 그대로 유지
  const {
    onCall,
    onNavigate,
    onToggleFavorite,
    isFavorite,
  } = props as SpotVariantProps;

  const callLabel = onCall ? "전화하기" : "통화 불가";
  const navLabel = onNavigate ? "길찾기" : "길찾기";
  const favLabel = isFavorite ? "찜됨" : "찜하기";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden">
      <div className="flex justify-around p-2">
        <button
          onClick={onCall}
          className="flex flex-col items-center text-sm text-gray-800 hover:text-blue-600"
        >
          <FaPhoneAlt className="text-lg mb-1" />
          {callLabel}
        </button>
        <button
          onClick={onNavigate}
          className="flex flex-col items-center text-sm text-gray-800 hover:text-green-600"
        >
          <FaLocationArrow className="text-lg mb-1" />
          {navLabel}
        </button>
        <button
          onClick={onToggleFavorite}
          className={`flex flex-col items-center text-sm ${
            isFavorite ? "text-red-500" : "text-gray-800 hover:text-red-500"
          }`}
        >
          <FaHeart className="text-lg mb-1" />
          {favLabel}
        </button>
      </div>
    </div>
  );
}
