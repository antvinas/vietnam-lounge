// src/components/plan/PlanItemCard.tsx
// 단일 아이템 카드. 정규화 스토어의 moveItemToDay 사용으로 상하/다음날 이동 구현.
import React from "react";
import { usePlanStore } from "@/store/plan.store";

type Block = any;

type Props = {
  dayKey: string;          // Day 식별자(id 또는 YYYY-MM-DD 호환 키)
  block: Block;
  index: number;           // 해당 day 내 index
};

export default function PlanItemCard({ dayKey, block, index }: Props) {
  const moveItemToDay = usePlanStore((s: any) => s.moveItemToDay);

  const nextDay = getNextDay(dayKey);

  const moveUp = () => {
    if (!moveItemToDay) return;
    const toIndex = Math.max(0, index - 1);
    moveItemToDay(block?.id, dayKey, toIndex);
  };

  const moveDown = () => {
    if (!moveItemToDay) return;
    const toIndex = index + 1;
    moveItemToDay(block?.id, dayKey, toIndex);
  };

  const moveToNextDay = () => {
    if (!moveItemToDay) return;
    moveItemToDay(block?.id, nextDay, 0);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="min-w-0 grow">
        <div className="truncate font-medium">{block?.title ?? block?.name ?? "Untitled"}</div>
        {block?.address && <div className="truncate text-xs opacity-70">{block.address}</div>}
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="위로 이동"
          title="위로 이동"
          onClick={moveUp}
          className="touch-target inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600"
          style={{ minWidth: 24, minHeight: 24 }}
        >
          ▲
        </button>
        <button
          aria-label="아래로 이동"
          title="아래로 이동"
          onClick={moveDown}
          className="touch-target inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 dark:border-slate-600"
          style={{ minWidth: 24, minHeight: 24 }}
        >
          ▼
        </button>
        <button
          aria-label="다음날로 이동"
          title={`다음날(${nextDay})로 이동`}
          onClick={moveToNextDay}
          className="touch-target inline-flex h-6 items-center justify-center rounded-md border border-slate-300 px-2 dark:border-slate-600"
          style={{ minWidth: 24, minHeight: 24 }}
        >
          다음날
        </button>
      </div>
    </div>
  );
}

function getNextDay(dayISO: string) {
  // id가 날짜가 아닌 경우에도 안전하게 처리
  const d = new Date(dayISO);
  if (Number.isNaN(d.getTime())) return dayISO;
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
