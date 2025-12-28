import React, { useState, useRef, useEffect } from "react";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

// 아이콘 컴포넌트 (중복 제거 및 가독성을 위해 상단 정의)
const Icon = {
  Dots: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Up: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>,
  Down: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>,
  Next: () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>,
};

export default function PlanItemCard({ dayKey, block, index }: { dayKey: string; block: any; index: number }) {
  const moveItemToDay = usePlanStore((s: any) => s.moveItemToDay);
  const setEditingItemId = usePlanUIStore((s: any) => s.setEditingItemId); // 🟢 패널 열기용
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [isOpen]);

  const handleAction = (e: React.MouseEvent, action: 'up' | 'down' | 'next') => {
    e.stopPropagation(); // 카드 클릭 방지
    setIsOpen(false);
    
    if (action === 'up') moveItemToDay(block.id, dayKey, Math.max(0, index - 1));
    if (action === 'down') moveItemToDay(block.id, dayKey, index + 1);
    if (action === 'next') {
      const nextDay = new Date(dayKey);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayISO = isNaN(nextDay.getTime()) ? dayKey : nextDay.toISOString().split('T')[0];
      moveItemToDay(block.id, nextDayISO, 0);
    }
  };

  return (
    <div 
      onClick={() => setEditingItemId(block.id)} // 🟢 클릭 시 상세 패널 오픈
      className="group relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      {/* 1. 번호 및 정보 */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600">
          {index + 1}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
            {block?.title || "이름 없음"}
          </div>
          {(block?.note || block?.address) && (
            <div className="truncate text-xs text-slate-500 opacity-80 dark:text-slate-400">
              {block.note || block.address}
            </div>
          )}
        </div>
      </div>

      {/* 2. 메뉴 버튼 (드롭다운) */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
        >
          <Icon.Dots />
        </button>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-800">
            <button onClick={(e) => handleAction(e, 'up')} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700">
              <Icon.Up /> 위로 이동
            </button>
            <button onClick={(e) => handleAction(e, 'down')} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700">
              <Icon.Down /> 아래로 이동
            </button>
            <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
            <button onClick={(e) => handleAction(e, 'next')} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
              <Icon.Next /> 다음날로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}