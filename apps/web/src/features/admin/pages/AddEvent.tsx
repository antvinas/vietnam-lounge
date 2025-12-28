// apps/web/src/features/admin/pages/AddEvent.tsx
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import EventForm from "@/features/admin/components/events/EventForm";
import { addEvent } from "@/features/admin/api/admin.api";
import type { AdminEventData } from "@/features/admin/api/admin.api";

export default function AddEvent() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const modeFromUrl = (sp.get("mode") || "explorer") as any;
  const safeMode = modeFromUrl === "nightlife" ? "nightlife" : "explorer";

  const defaults = useMemo<Partial<AdminEventData>>(
    () => ({
      mode: safeMode,
      // ✅ 운영 사고 방지: 신규 이벤트는 기본값을 '비공개'로 둡니다.
      // (편집 화면에서 공개 전환)
      visibility: "private",
      isPublic: false,

      title: "",
      date: "",
      endDate: "",
      city: "",
      category: "",
      location: "",
      host: "VN Lounge",
      description: "",
      images: [],
    }),
    [safeMode]
  );

  return (
    <div className="p-4">
      <div className="mx-auto max-w-6xl">
        <EventForm
          title="이벤트 등록"
          isCreate
          defaultValues={defaults}
          onCancel={() => navigate(`/admin/events?mode=${safeMode}`)}
          onSave={async (payload, intent) => {
            const created = await addEvent(payload);
            const newId = (created as any)?.id;
            if (intent === "saveAndList") {
              navigate(`/admin/events?mode=${payload.mode || safeMode}`);
              return;
            }
            if (newId) {
              navigate(`/admin/events/${newId}/edit?mode=${payload.mode || safeMode}`);
              return;
            }
            navigate(`/admin/events?mode=${payload.mode || safeMode}`);
          }}
        />
      </div>
    </div>
  );
}
