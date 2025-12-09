// apps/web/src/features/plan/components/plan/InspectorPanel.tsx

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useFocusTrap } from "@/utils/a11y/useFocusTrap";
import { announce } from "@/utils/a11y/ariaLive";

import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

type ItemId = string;

type EditableItem = {
  id: ItemId;
  title?: string;
  note?: string;
  cost?: number;
  startTime?: string;
  endTime?: string;
  stayMinutes?: number;
  placeId?: string;
  lat?: number;
  lng?: number;
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const hh = h.toString().padStart(2, "0");
  return `${hh}:${m}`;
});

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

export default function InspectorPanel() {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const selectedItemId = usePlanUIStore((s) => s.selectedItemId);
  const isItemDetailOpen = usePlanUIStore((s) => s.isItemDetailOpen);
  const setSelectedItemId = usePlanUIStore((s) => s.setSelectedItemId);
  const closeItemDetail = usePlanUIStore((s) => s.closeItemDetail);

  const close = useCallback(() => {
    closeItemDetail();
    setSelectedItemId(null);
  }, [closeItemDetail, setSelectedItemId]);

  useFocusTrap(panelRef, !!selectedItemId && isItemDetailOpen);

  const { item, updateItem } = usePlanStore((s) => {
    if (!selectedItemId) {
      return { item: null, updateItem: (_id: ItemId, _p: Partial<any>) => {} };
    }
    const it = (s as any).items?.[selectedItemId] as any;
    return { item: it, updateItem: s.updateItem };
  });

  const [local, setLocal] = useState<EditableItem | null>(null);

  useEffect(() => {
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
  }, [item]);

  const derivedEnd = useMemo(() => {
    if (!local) return "";
    if (local.startTime && local.stayMinutes != null) {
      const st = toMinutes(local.startTime) ?? 0;
      const en = st + local.stayMinutes;
      return toTimeString(en >= 1440 ? 1439 : en);
    }
    return local.endTime || "";
  }, [local?.startTime, local?.endTime, local?.stayMinutes]);

  if (!isItemDetailOpen || !item || !local) return null;

  const onChange = <K extends keyof EditableItem>(
    key: K,
    value: EditableItem[K],
  ) => {
    setLocal((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const addStayTime = (minutes: number) => {
    setLocal((prev) => {
      if (!prev) return null;
      const current = prev.stayMinutes ?? 0;
      return { ...prev, stayMinutes: current + minutes };
    });
  };

  const handleSave = () => {
    if (!local) return;
    const payload: any = {
      title: local.title,
      note: local.note,
      cost: local.cost,
      timeStartMin: toMinutes(local.startTime),
      timeEndMin: toMinutes(derivedEnd || local.endTime),
      stayMinutes: local.stayMinutes,
    };
    updateItem(local.id, payload);
    announce("저장되었습니다.");
    close();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  };

  return (
    <>
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      
      <aside
        ref={panelRef}
        className="absolute inset-y-2 right-2 z-30 flex w-[min(100%,26rem)] flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            일정 상세
          </h2>
          <button
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            onClick={close}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>

        {/* Body: 가로 배치(Grid) */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 scrollbar-hide">
          
          {/* 장소명 */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">장소명</label>
            <input
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={local.title ?? ""}
              onChange={(e) => onChange("title", e.target.value)}
            />
          </div>

          {/* 방문 시간 */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">방문 시간</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  className="w-full appearance-none rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  value={local.startTime || ""}
                  onChange={(e) => onChange("startTime", e.target.value)}
                >
                  <option value="">미정</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <span className="text-slate-400">~</span>
              <input
                className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                value={derivedEnd}
                readOnly
                placeholder="자동"
              />
            </div>
          </div>

          {/* 체류 시간 */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">체류 시간</label>
            <div className="flex items-center gap-2">
              <div className="relative w-24">
                <input
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 pr-8 text-right text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600"
                  type="number"
                  min={0}
                  step={10}
                  value={local.stayMinutes ?? 0}
                  onChange={(e) => onChange("stayMinutes", Number(e.target.value))}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  분
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => addStayTime(30)}
                className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                +30분
              </button>
              <button
                type="button"
                onClick={() => addStayTime(60)}
                className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                +1시간
              </button>
            </div>
          </div>

          <hr className="my-2 border-slate-100 dark:border-slate-700" />

          {/* 비용 */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">비용 (VND)</label>
            <div className="relative">
              <input
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 pl-6 text-right text-sm font-medium tabular-nums text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                type="text"
                value={local.cost?.toLocaleString() ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (!/^\d*$/.test(raw)) return;
                  onChange("cost", raw === "" ? 0 : Number(raw));
                }}
                placeholder="0"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₫</span>
            </div>
          </div>

          {/* 메모 */}
          <div className="grid grid-cols-[80px_1fr] items-start gap-3">
            <label className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">메모</label>
            <textarea
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              rows={3}
              value={local.note ?? ""}
              onChange={(e) => onChange("note", e.target.value)}
              placeholder="메뉴, 예약번호 등..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <button
            onClick={close}
            className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 active:scale-95"
          >
            저장하기
          </button>
        </div>
      </aside>
    </>
  );
}