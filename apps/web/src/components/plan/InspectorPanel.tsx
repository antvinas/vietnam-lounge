// apps/web/src/components/plan/InspectorPanel.tsx
/**
 * InspectorPanel
 * - 선택 아이템 시간/체류/비용/메모 편집
 * - 포커스 트랩/ESC 닫기/라이브 공지 적용
 */
import React, { useMemo, useRef, useState } from "react";
import { useFocusTrap } from "@/utils/a11y/useFocusTrap";
import { announce } from "@/utils/a11y/ariaLive";

import { usePlanStore } from "@/store/plan.store";
import { usePlanUIStore } from "@/store/plan.ui.store";

type ItemId = string;

type EditableItem = {
  id: ItemId;
  title?: string;
  note?: string;
  cost?: number;
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
  stayMinutes?: number;
  placeId?: string;
  lat?: number;
  lng?: number;
};

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function toTimeString(minutes: number | undefined): string {
  if (minutes == null || Number.isNaN(minutes)) return "";
  const h = Math.floor(minutes / 60);
  const m = Math.max(0, Math.round(minutes - h * 60));
  return `${pad2(h)}:${pad2(m)}`;
}

function toMinutes(hhmm: string | undefined): number | undefined {
  if (!hhmm) return undefined;
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return undefined;
  return h * 60 + m;
}

/* ──────────────────────────── 컴포넌트 ──────────────────────────── */

export default function InspectorPanel() {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const selectedItemId = usePlanUIStore((s) => s.selectedItemId);
  const close = usePlanUIStore((s) => s.clearSelection);

  // 선택된 아이템이 있을 때만 포커스 트랩 활성
  useFocusTrap(panelRef, !!selectedItemId);

  const { item, updateItem } = usePlanStore((s) => {
    if (!selectedItemId) {
      return {
        item: null,
        updateItem: (_id: ItemId, _p: Partial<any>) => {},
      };
    }
    const it = s.items[selectedItemId] as any;
    return {
      item: it,
      updateItem: s.updateItem,
    };
  });

  const [local, setLocal] = useState<EditableItem | null>(() => {
    if (!item) return null;
    return {
      id: item.id,
      title: item.title,
      note: item.note,
      cost: item.cost,
      startTime: toTimeString(item.timeStartMin),
      endTime: toTimeString(item.timeEndMin),
      stayMinutes: item.stayMinutes,
      placeId: item.placeId,
      lat: item.lat,
      lng: item.lng,
    };
  });

  React.useEffect(() => {
    if (!item) {
      setLocal(null);
    } else {
      setLocal({
        id: item.id,
        title: item.title,
        note: item.note,
        cost: item.cost,
        startTime: toTimeString(item.timeStartMin),
        endTime: toTimeString(item.timeEndMin),
        stayMinutes: item.stayMinutes,
        placeId: item.placeId,
        lat: item.lat,
        lng: item.lng,
      });
    }
  }, [item?.id]);

  const derivedEnd = useMemo(() => {
    if (!local) return "";
    if (local.endTime) return local.endTime;
    if (local.startTime && local.stayMinutes != null) {
      const st = toMinutes(local.startTime) ?? 0;
      const en = st + local.stayMinutes;
      return toTimeString(en);
    }
    return local.endTime ?? "";
  }, [local]);

  // 요약용 라벨들
  const summaryLabel = useMemo(() => {
    if (!local) return "";
    const start = local.startTime || "";
    const end = derivedEnd || "";
    const stay =
      local.stayMinutes != null && local.stayMinutes > 0
        ? ` · 체류 ${local.stayMinutes}분`
        : "";
    const cost =
      local.cost != null && local.cost > 0
        ? ` · ${local.cost.toLocaleString("ko-KR")} VND`
        : "";
    if (!start && !end && !stay && !cost) return "";
    return `${start || "—"} ~ ${end || "—"}${stay}${cost}`;
  }, [local, derivedEnd]);

  // 선택된 아이템이 없으면 패널 자체를 렌더하지 않음
  if (!item || !local) return null;

  const onChange = <K extends keyof EditableItem>(
    key: K,
    value: EditableItem[K]
  ) => {
    setLocal((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = () => {
    if (!local) return;

    const payload: any = {
      title: local.title,
      note: local.note,
      cost: local.cost,
      timeStartMin: toMinutes(local.startTime),
      timeEndMin: toMinutes(derivedEnd),
      stayMinutes: local.stayMinutes,
    };

    updateItem(local.id, payload);
    announce("일정 정보가 저장되었습니다.");
    close();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  };

  return (
    <aside
      ref={panelRef}
      className="
        absolute inset-y-2 right-2
        z-30
        flex w-[min(100%,18rem)] max-w-[70%] flex-col
        rounded-2xl border border-slate-200
        bg-white/95 shadow-lg backdrop-blur
        dark:border-slate-700 dark:bg-slate-900/95
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-title"
      aria-describedby="inspector-desc"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-slate-700">
        <div className="min-w-0">
          <h2
            id="inspector-title"
            className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50"
          >
            일정 상세 편집
          </h2>
          <p
            id="inspector-desc"
            className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400"
          >
            시간, 체류, 비용, 메모를 편집하고 저장할 수 있어요. Esc로 닫을 수
            있습니다.
          </p>
        </div>
        <button
          className="ml-2 shrink-0 rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={close}
          aria-label="세부편집 닫기"
        >
          닫기
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 text-xs">
        {/* 요약 블록 */}
        {summaryLabel && (
          <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              현재 일정 요약
            </div>
            <div className="break-words">{summaryLabel}</div>
          </div>
        )}

        {/* 제목 */}
        <div className="mb-3">
          <div className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            제목
          </div>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
            value={local.title ?? ""}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="예: 미케 비치 카페, 공항 출발 등"
          />
        </div>

        {/* 시간 설정 섹션 */}
        <div className="mb-3">
          <div className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            시간 설정
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs text-slate-600 dark:text-slate-300">
              시작
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
                type="time"
                value={local.startTime ?? ""}
                onChange={(e) => onChange("startTime", e.target.value)}
              />
            </label>
            <label className="block text-xs text-slate-600 dark:text-slate-300">
              종료
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
                type="time"
                value={derivedEnd}
                onChange={(e) => onChange("endTime", e.target.value)}
              />
            </label>
          </div>

          <div className="mt-3">
            <label className="block text-xs text-slate-600 dark:text-slate-300">
              체류 시간 (분)
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
                type="number"
                min={0}
                value={local.stayMinutes ?? ""}
                onChange={(e) =>
                  onChange(
                    "stayMinutes",
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value)
                  )
                }
                placeholder="예: 60"
              />
            </label>
          </div>
        </div>

        {/* 비용 & 메모 섹션 */}
        <div className="mb-2">
          <div className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            비용 & 메모
          </div>

          <label className="block text-xs text-slate-600 dark:text-slate-300">
            예상 비용 (VND)
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
              type="number"
              min={0}
              step="1000"
              value={local.cost ?? 0}
              onChange={(e) =>
                onChange(
                  "cost",
                  e.target.value === "" ? 0 : Number(e.target.value)
                )
              }
              placeholder="예: 150000"
            />
          </label>

          <label className="mt-3 block text-xs text-slate-600 dark:text-slate-300">
            메모
            <textarea
              className="mt-1 w-full min-h-[72px] rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs leading-relaxed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
              value={local.note ?? ""}
              onChange={(e) => onChange("note", e.target.value)}
              placeholder="예: 에그커피 1개 + 디저트 1개, 인당 150k 정도"
            />
          </label>
        </div>
      </div>

      {/* Footer 버튼 영역 */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-3 py-2.5 dark:border-slate-700">
        <button
          type="button"
          className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={close}
        >
          취소
        </button>
        <button
          type="button"
          className="rounded bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          onClick={handleSave}
        >
          저장
        </button>
      </div>
    </aside>
  );
}
