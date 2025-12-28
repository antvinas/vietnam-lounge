// src/features/plan/components/Wizard/StepSeedSpots.tsx

import type { SeedState, SeedSpot } from "@/features/plan/hooks/usePlanWizard";

export default function StepSeedSpots({
  value,
  onChange,
}: {
  value: SeedState;
  onChange: (v: SeedState) => void;
}) {
  const add = (s?: Partial<SeedSpot>) =>
    onChange({ spots: [...value.spots, { title: s?.title ?? "", lat: s?.lat, lng: s?.lng, cost: s?.cost }] });
  const upd = (i: number, patch: Partial<SeedSpot>) =>
    onChange({
      spots: value.spots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  const del = (i: number) =>
    onChange({ spots: value.spots.filter((_, idx) => idx !== i) });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">초기 스팟</h3>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border px-2.5 py-1.5 text-sm"
            onClick={() => add()}
          >
            + 추가
          </button>
          <button
            type="button"
            className="rounded-md border px-2.5 py-1.5 text-sm"
            onClick={() => {
              onChange({
                spots: [
                  { title: "Hoan Kiem Lake", lat: 21.0285, lng: 105.8542, cost: 0 },
                  { title: "Old Quarter", lat: 21.035, lng: 105.848, cost: 0 },
                ],
              });
            }}
          >
            샘플 넣기
          </button>
        </div>
      </div>

      {value.spots.length === 0 && (
        <p className="text-xs text-gray-500">“샘플 넣기”를 눌러 바로 시작해도 된다.</p>
      )}

      <div className="grid gap-3">
        {value.spots.map((s, i) => (
          <div key={i} className="rounded-md border p-3 grid gap-2">
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="장소명"
                value={s.title}
                onChange={(e) => upd(i, { title: e.target.value })}
                className="w-full rounded-md border px-3 py-2"
              />
              <button
                type="button"
                className="ml-2 rounded-md border px-2 py-1 text-xs"
                onClick={() => del(i)}
              >
                삭제
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="lat"
                value={s.lat ?? ""}
                onChange={(e) => upd(i, { lat: e.target.value ? Number(e.target.value) : undefined })}
                className="rounded-md border px-2 py-1"
              />
              <input
                type="number"
                placeholder="lng"
                value={s.lng ?? ""}
                onChange={(e) => upd(i, { lng: e.target.value ? Number(e.target.value) : undefined })}
                className="rounded-md border px-2 py-1"
              />
              <input
                type="number"
                placeholder="cost"
                value={s.cost ?? 0}
                onChange={(e) => upd(i, { cost: Number(e.target.value) || 0 })}
                className="rounded-md border px-2 py-1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
