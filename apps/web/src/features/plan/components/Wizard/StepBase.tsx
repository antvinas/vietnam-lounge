// src/features/plan/components/Wizard/StepBase.tsx

import type { BaseState } from "@/features/plan/hooks/usePlanWizard";

export default function StepBase({
  value,
  onChange,
}: {
  value: BaseState;
  onChange: (v: BaseState) => void;
}) {
  return (
    <form className="grid gap-4">
      <label className="grid gap-1">
        <span className="text-sm">숙소/거점 이름</span>
        <input
          type="text"
          placeholder="예: Novotel Phu Quoc"
          value={value.hotelName ?? ""}
          onChange={(e) => onChange({ ...value, hotelName: e.target.value || undefined })}
          className="rounded-md border px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm">위도(lat)</span>
          <input
            type="number"
            value={value.lat ?? ""}
            onChange={(e) => onChange({ ...value, lat: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded-md border px-3 py-2"
            placeholder="10.227"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">경도(lng)</span>
          <input
            type="number"
            value={value.lng ?? ""}
            onChange={(e) => onChange({ ...value, lng: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded-md border px-3 py-2"
            placeholder="103.964"
          />
        </label>
      </div>

      <p className="text-xs text-gray-500">좌표는 선택사항. 없으면 기본 중심으로 경로를 계산한다.</p>
    </form>
  );
}
