import React, { useEffect, useState } from "react";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

// 아이콘
const Icons = {
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Save: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
};

export default function InspectorPanel() {
  // 스토어 연결
  const editingItemId = usePlanUIStore((s: any) => s.editingItemId);
  const setEditingItemId = usePlanUIStore((s: any) => s.setEditingItemId);
  const updateItem = usePlanStore((s: any) => s.updateItem);
  
  // 현재 선택된 아이템 데이터 가져오기
  const item = usePlanStore((s: any) => 
    editingItemId ? s.items[editingItemId] : null
  );

  // 로컬 상태 (입력 폼)
  const [note, setNote] = useState("");
  const [cost, setCost] = useState("");
  const [startTime, setStartTime] = useState("");

  // 아이템 변경 시 폼 초기화
  useEffect(() => {
    if (item) {
      setNote(item.note || "");
      setCost(item.cost ? String(item.cost) : "");
      setStartTime(item.startTime || "");
    }
  }, [item?.id]);

  // 아이템이 없으면 패널 닫기
  if (!item) return null;

  const handleClose = () => setEditingItemId(null);

  // 🟢 데이터 변경 핸들러 (입력 즉시 저장)
  const handleChange = (field: string, value: any) => {
    // 1. 로컬 상태 업데이트
    if (field === "note") setNote(value);
    if (field === "cost") setCost(value);
    if (field === "startTime") setStartTime(value);

    // 2. 스토어 업데이트 (리스트에 즉시 반영됨)
    updateItem(item.id, {
      [field]: value === "" ? null : (field === "cost" ? Number(value) : value)
    });
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">상세 편집</h3>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <Icons.Close />
        </button>
      </div>

      {/* 입력 폼 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 장소명 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">장소명</label>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 dark:bg-zinc-800 dark:text-gray-200">
            {item.title}
          </div>
        </div>

        {/* 방문 시간 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">방문 시간</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => handleChange("startTime", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        {/* 예상 비용 */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">예상 비용 (VND)</label>
          <input
            type="number"
            placeholder="0"
            value={cost}
            onChange={(e) => handleChange("cost", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>

        {/* 메모 입력 (핵심) */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">메모 / 특이사항</label>
          <textarea
            rows={6}
            placeholder="장소에 대한 메모를 입력하세요... (예: 예약번호, 주문메뉴)"
            value={note}
            onChange={(e) => handleChange("note", e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">입력 내용은 일정 리스트에 바로 표시됩니다.</p>
        </div>

      </div>

      {/* 하단 닫기 버튼 */}
      <div className="border-t border-gray-200 p-4 dark:border-zinc-800">
        <button
          onClick={handleClose}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          <Icons.Save />
          편집 완료
        </button>
      </div>
    </div>
  );
}