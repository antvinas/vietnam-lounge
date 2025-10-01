import { useEffect, useRef, useState } from "react";
import { usePlanStore } from "@/store/usePlanStore";
import PlanItemCard from "@/components/plan/PlanItemCard";
import MoveBlock from "@/components/plan/MoveBlock"; // ✅ 절대경로 수정
import type { TimelineBlock, PlanItem } from "@/types/plan";
import { estimateETA } from "@/lib/routeClient";

export default function Timeline() {
  const { blocks, reorder, setBlocks } = usePlanStore();
  const dragFrom = useRef<number | null>(null);
  const [calcLock, setCalcLock] = useState(false);

  // 인접 일정 사이 자동 이동블록 삽입 (더미 ETA 계산)
  useEffect(() => {
    if (calcLock) return;
    setCalcLock(true);

    (async () => {
      const ordered = [...blocks].sort((a, b) => a.order - b.order);
      const withMoves: TimelineBlock[] = [];

      for (let i = 0; i < ordered.length; i++) {
        const cur = ordered[i] as PlanItem;
        withMoves.push({ ...cur });

        const next = ordered[i + 1] as PlanItem | undefined;
        if (!next) continue;

        if (cur.lat && cur.lng && next.lat && next.lng) {
          const { minutes, cost } = await estimateETA(
            { lat: cur.lat, lng: cur.lng },
            { lat: next.lat, lng: next.lng },
            "grab"
          );

          withMoves.push({
            id: `move-${cur.id}-${next.id}`,
            type: "move",
            fromId: cur.id,
            toId: next.id,
            mode: "grab",
            etaMin: minutes,
            cost,
            order: cur.order + 0.5,
          });
        }
      }

      // move 포함 후 순서 재정렬
      setBlocks(withMoves.map((b, idx) => ({ ...b, order: idx })) as any);
      setCalcLock(false);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks.filter((b) => (b as any).type !== "move").map((b) => b.id).join("|")]);

  return (
    <div className="space-y-3">
      {blocks
        .sort((a, b) => a.order - b.order)
        .map((b, idx) =>
          (b as any).type === "move" ? (
            <MoveBlock key={(b as any).id} {...(b as any)} order={idx} />
          ) : (
            <PlanItemCard
              key={b.id}
              item={b as PlanItem}
              index={idx}
              onDragStart={(i) => (dragFrom.current = i)}
              onDrop={(i) => {
                if (dragFrom.current !== null) reorder(dragFrom.current, i);
                dragFrom.current = null;
              }}
            />
          )
        )}
    </div>
  );
}
