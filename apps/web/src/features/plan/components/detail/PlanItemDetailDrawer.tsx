import React, { useEffect } from "react";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

type Props = {};

export default function PlanItemDetailDrawer(_: Props) {
  const editingItemId = usePlanUIStore((s: any) => s.editingItemId);
  const setEditingItemId = usePlanUIStore((s: any) => s.setEditingItemId);

  const item = editingItemId
    ? (usePlanStore.getState().items as any)[editingItemId]
    : null;

  function closeDrawer() {
    setEditingItemId(null);
  }

  // ESC 키 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 아이템이 없으면 렌더링 안 함
  if (!editingItemId || !item) return null;

  // 🟢 [수정] Portal 제거 -> 부모 레이아웃(PlanPage) 우측에 붙을 수 있는 패널로 변경
  return (
    <div className="flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          일정 편집
        </h2>
        <button
          type="button"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          onClick={closeDrawer}
        >
          ✕
        </button>
      </div>

      {/* 내용 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
            제목
          </label>
          <input
            type="text"
            value={item.title}
            onChange={(e) =>
              usePlanStore.getState().updateItem(item.id, { title: e.target.value })
            }
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
            메모 / 노트
          </label>
          <textarea
            value={item.note || ""}
            onChange={(e) =>
              usePlanStore.getState().updateItem(item.id, { note: e.target.value })
            }
            className="h-32 w-full resize-none rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="메모를 입력하세요..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              시작 시간
            </label>
            <input
              type="time"
              value={item.startTime ?? ""}
              onChange={(e) =>
                usePlanStore.getState().updateItem(item.id, { startTime: e.target.value })
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              종료 시간
            </label>
            <input
              type="time"
              value={item.endTime ?? ""}
              onChange={(e) =>
                usePlanStore.getState().updateItem(item.id, { endTime: e.target.value })
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <button
          type="button"
          className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          onClick={closeDrawer}
        >
          저장 및 닫기
        </button>
      </div>
    </div>
  );
}