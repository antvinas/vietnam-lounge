// apps/web/src/features/plan/components/plan/MobileDetailSheet.tsx

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";

import MobileSheet from "@/features/plan/components/layout/MobileSheet";
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

export default function MobileDetailSheet() {
  const {
    selectedItemId,
    isItemDetailOpen,
    setSelectedItemId,
    closeItemDetail,
    setEditingItemId,
  } = usePlanUIStore((s) => s);

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

  const handleClose = () => {
    closeItemDetail();
    setSelectedItemId(null);
    setEditingItemId(null);
  };

  const onChange = <K extends keyof EditableItem>(
    key: K,
    value: EditableItem[K]
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
    toast.success("일정이 저장되었습니다.");
    handleClose();
  };

  if (!isItemDetailOpen || !local) return null;

  const footer = (
    <div className="flex w-full gap-2">
      <button
        onClick={handleClose}
        className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 active:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      >
        취소
      </button>
      <button
        onClick={handleSave}
        className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-sm active:bg-emerald-600"
      >
        저장하기
      </button>
    </div>
  );

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

      <MobileSheet
        open={isItemDetailOpen}
        onClose={handleClose}
        title="일정 상세 편집"
        initialSnap="large"
        footer={footer}
      >
        {/* 모바일도 PC와 동일한 가로 배치 레이아웃 적용 */}
        <div className="flex flex-col gap-4 p-4 pb-6">
          
          {/* 장소명 */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">장소명</label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  value={local.startTime || ""}
                  onChange={(e) => onChange("startTime", e.target.value)}
                >
                  <option value="">미정</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">▼</div>
              </div>
              <span className="text-slate-400">~</span>
              <input
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                value={derivedEnd}
                readOnly
                placeholder="자동"
              />
            </div>
          </div>

          {/* 체류 시간: bg-white 적용 */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">체류 시간</label>
            <div className="flex items-center gap-2">
              <div className="relative w-24 shrink-0">
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-right text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
              <div className="flex flex-1 gap-2">
                <button
                  type="button"
                  onClick={() => addStayTime(30)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 active:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  +30분
                </button>
                <button
                  type="button"
                  onClick={() => addStayTime(60)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 active:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  +1시간
                </button>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* 비용 */}
          <div className="grid grid-cols-[80px_1fr] items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">비용 (VND)</label>
            <div className="relative">
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pl-8 text-right text-sm font-medium tabular-nums text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                type="text"
                value={local.cost?.toLocaleString() ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (!/^\d*$/.test(raw)) return;
                  onChange("cost", raw === "" ? 0 : Number(raw));
                }}
                placeholder="0"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                ₫
              </span>
            </div>
          </div>

          {/* 메모 */}
          <div className="grid grid-cols-[80px_1fr] items-start gap-3">
            <label className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">메모</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              rows={4}
              value={local.note ?? ""}
              onChange={(e) => onChange("note", e.target.value)}
              placeholder="메뉴 추천, 예약 번호 등..."
            />
          </div>

        </div>
      </MobileSheet>
    </>
  );
}