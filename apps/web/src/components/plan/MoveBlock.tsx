import type { MoveBlock as MB } from "@/types/plan";

export default function MoveBlock({ etaMin, mode }: MB & { order: number }) {
  const label =
    mode === "walk" ? "도보" : mode === "bus" ? "대중교통" : "그랩";

  return (
    <div className="mx-14 my-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 p-3 text-sm text-slate-600 dark:text-slate-300">
      <span className="font-medium">{label}</span> 이동 · 예상 {etaMin}분
    </div>
  );
}
