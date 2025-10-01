import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"; // ✅ 최신 권장 패키지
import {
  getPlanById,
  createPlan,
  updatePlan,
} from "@/api/plan.api"; // Firestore API 클라이언트 (직접 구현 필요)
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

import type { PlanItem } from "@/types/plan";
import PlanItemCard from "@/components/plan/PlanItemCard";
import Loading from "@/components/common/Loading";

export default function Planner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 플랜 불러오기
  const {
    data: plan,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["plan", id],
    queryFn: () => (id ? getPlanById(id) : null),
    enabled: !!id, // id 없을 때는 실행 안 함
  });

  // 새 플랜 생성
  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      navigate(`/plan/${newPlan.id}/share`);
    },
  });

  // 플랜 업데이트
  const updateMutation = useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan", id] });
    },
  });

  const [items, setItems] = useState<PlanItem[]>(plan?.items || []);

  if (isLoading) return <Loading />;
  if (error) return <div className="p-6 text-red-600">에러가 발생했습니다.</div>;

  // Drag & Drop 완료 시 실행
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setItems(reordered);

    if (id) {
      updateMutation.mutate({
        id,
        items: reordered,
      });
    }
  };

  const handleCreate = () => {
    createMutation.mutate({
      title: "새 여행 플랜",
      days: 1,
      startDate: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {id ? "플랜 편집" : "새 플랜 만들기"}
        </h1>
        {!id && (
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-700 transition"
          >
            {createMutation.isPending ? "생성중..." : "새 플랜 생성"}
          </button>
        )}
      </header>

      {/* Drag & Drop 리스트 */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="plan-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {items.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <PlanItemCard
                        item={item}
                        index={index}
                        onDragStart={() => {}}
                        onDrop={() => {}}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </main>
  );
}
