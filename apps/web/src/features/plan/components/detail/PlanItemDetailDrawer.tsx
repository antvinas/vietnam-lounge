// apps/web/src/features/plan/components/detail/PlanItemDetailDrawer.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

type Props = {};

export default function PlanItemDetailDrawer(_: Props) {
  const editingItemId = usePlanUIStore((s) => s.editingItemId);
  const setEditingItemId = usePlanUIStore((s) => s.setEditingItemId);

  const item = editingItemId
    ? (usePlanStore.getState().items as any)[editingItemId]
    : null;

  // 닫기 함수
  function closeDrawer() {
    setEditingItemId(null);
  }

  // ESC 키 누르면 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDrawer();
      }
    }
    if (editingItemId) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editingItemId]);

  if (!editingItemId || !item) return null;

  // Portal을 써서 body 끝에 렌더 (모달/오버레이 느낌)
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={closeDrawer}
    >
      {/* 배경 반투명 레이어 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Drawer 본체 */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-lg overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            일정 편집
          </h2>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            onClick={closeDrawer}
          >
            닫기 ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              제목
            </label>
            <input
              type="text"
              value={item.title}
              onChange={(e) =>
                usePlanStore.getState().updateItem(item.id, {
                  title: e.target.value,
                })
              }
              className="w-full border rounded px-2 py-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
              메모 / 노트
            </label>
            <textarea
              value={item.note || ""}
              onChange={(e) =>
                usePlanStore.getState().updateItem(item.id, {
                  note: e.target.value,
                })
              }
              className="w-full border rounded px-2 py-1 h-20 resize-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            />
          </div>

          {/* 예: 시간 편집, 교통 수단, 비용 등 추가 입력 필드 넣을 수 있음 */}
          {/* 아래는 예시 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400">
                시작 시간
              </label>
              <input
                type="time"
                value={item.startTime ?? ""}
                onChange={(e) =>
                  usePlanStore.getState().updateItem(item.id, {
                    startTime: e.target.value,
                  })
                }
                className="w-full border rounded px-2 py-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 dark:text-slate-400">
                종료 시간
              </label>
              <input
                type="time"
                value={item.endTime ?? ""}
                onChange={(e) =>
                  usePlanStore.getState().updateItem(item.id, {
                    endTime: e.target.value,
                  })
                }
                className="w-full border rounded px-2 py-1 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          {/* 저장 버튼 (지금은 변경 즉시 store 반영 중이므로 단순 닫기) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              className="w-full bg-emerald-500 text-white py-2 rounded hover:bg-emerald-600"
              onClick={closeDrawer}
            >
              저장 & 닫기
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
