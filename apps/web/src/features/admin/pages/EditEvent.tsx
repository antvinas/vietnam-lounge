// apps/web/src/features/admin/pages/EditEvent.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import EventForm from "@/features/admin/components/events/EventForm";
import EventAuditTrail from "@/features/admin/components/events/EventAuditTrail";
import { getEventById, updateEvent } from "@/features/admin/api/admin.api";
import type { AdminEventData } from "@/features/admin/api/admin.api";

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sp] = useSearchParams();

  const modeFromUrl = (sp.get("mode") || "explorer") as any;
  const safeMode = modeFromUrl === "nightlife" ? "nightlife" : "explorer";

  const [data, setData] = useState<AdminEventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        setLoading(true);
        // ✅ 컬렉션(events/adult_events) 자동 탐색
        const ev = await getEventById(id);
        if (!mounted) return;
        setData((ev as any) ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const defaults = useMemo<Partial<AdminEventData>>(() => {
    if (!data) return { mode: safeMode };
    return data;
  }, [data, safeMode]);

  if (!id) {
    return <div className="p-4 text-sm text-muted-foreground">잘못된 접근입니다. (id 없음)</div>;
  }

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">로딩중...</div>;
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="text-sm text-muted-foreground">이벤트를 찾을 수 없습니다.</div>
        <button
          className="mt-3 rounded-md border px-3 py-2 text-sm"
          onClick={() => navigate(`/admin/events?mode=${safeMode}`)}
        >
          목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <EventForm
          title="이벤트 편집"
          isCreate={false}
          eventId={id}
          lockMode
          defaultValues={defaults}
          onCancel={() => navigate(`/admin/events?mode=${data.mode || safeMode}`)}
          onSave={async (payload, intent) => {
            await updateEvent(id, payload);

            if (intent === "saveAndList") {
              navigate(`/admin/events?mode=${payload.mode || safeMode}`);
              return;
            }

            // stay
            return;
          }}
        />

        {/* ✅ Progressive Disclosure: 변경 이력은 필요할 때만 펼치기 */}
        <details className="rounded-2xl border border-gray-200 bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-extrabold text-gray-900">
            변경 이력 (심사/CS)
          </summary>
          <div className="px-4 pb-4">
            <EventAuditTrail eventId={id} limit={50} />
          </div>
        </details>
      </div>
    </div>
  );
}
