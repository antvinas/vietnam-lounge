import React from "react";

/**
 * 데스크톱 전용 밀도 토글(컴팩트/컴포트).
 * - document.documentElement 에 data-density 속성 세팅
 * - localStorage("ui:density")로 영속
 * - role="radiogroup" + role="radio" 패턴
 * - 프로젝트 어디서든 가져다 써도 독립적으로 동작
 */
type Density = "comfortable" | "compact";

function applyDensity(next: Density) {
  const root = document.documentElement;
  root.setAttribute("data-density", next);
  try {
    localStorage.setItem("ui:density", next);
  } catch {}
}

function readInitial(): Density {
  try {
    const saved = localStorage.getItem("ui:density") as Density | null;
    if (saved === "compact" || saved === "comfortable") return saved;
  } catch {}
  return "comfortable";
}

export default function DensityToggle({
  className,
  onChange,
  labels = { comfortable: "컴포트", compact: "컴팩트" },
}: {
  className?: string;
  onChange?: (d: Density) => void;
  labels?: { comfortable: string; compact: string };
}) {
  const [value, setValue] = React.useState<Density>(() => readInitial());

  React.useEffect(() => {
    applyDensity(value);
  }, []); // mount 시 반영

  const set = (next: Density) => {
    setValue(next);
    applyDensity(next);
    onChange?.(next);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      set(value === "comfortable" ? "compact" : "comfortable");
    }
  };

// ✅ Admin에서는 UI 토글을 숨김(원하면: 관리자 화면의 조작 포인트 최소화)
const isAdmin = typeof document !== "undefined" && document.documentElement.getAttribute("data-admin") === "1";
if (isAdmin) return null;

  return (
    <div
      className={`hidden lg:inline-flex items-center rounded-xl border bg-white/80 px-1 py-1 shadow-sm backdrop-blur dark:bg-slate-900/80 ${
        className ?? ""
      }`}
      role="radiogroup"
      aria-label="밀도 토글"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "comfortable"}
        className={`px-3 py-1.5 text-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          value === "comfortable"
            ? "bg-slate-100 dark:bg-slate-800"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
        }`}
        onClick={() => set("comfortable")}
      >
        {labels.comfortable}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "compact"}
        className={`ml-1 px-3 py-1.5 text-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          value === "compact"
            ? "bg-slate-100 dark:bg-slate-800"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
        }`}
        onClick={() => set("compact")}
      >
        {labels.compact}
      </button>
    </div>
  );
}
