import React, { useCallback, useEffect, useRef, useState } from "react";

type PlanItem = { id: string; title: string; placeId?: string; lat?: number; lng?: number; address?: string };
type Day = { key: string; dateLabel: string };
type Props = { days: Day[]; onAddToDay: (dayKey: string, item: PlanItem) => void; onCreateNote?: (dayKey: string) => void; className?: string };

async function ensurePlaces() {
  // 공식 가이드: importLibrary("places") 사용
  // @ts-ignore
  if (google?.maps?.places) return;
  await google.maps.importLibrary("places");
}

export default function PlannerSidebar({ days, onAddToDay, onCreateNote, className }: Props) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PlanItem[]>([]);
  const svcRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    (async () => {
      await ensurePlaces();
      if (!svcRef.current) svcRef.current = new google.maps.places.PlacesService(document.createElement("div"));
    })();
  }, []);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    await ensurePlaces();
    if (!svcRef.current) svcRef.current = new google.maps.places.PlacesService(document.createElement("div"));
    setBusy(true);
    setResults([]);
    const request: google.maps.places.TextSearchRequest = { query: q };
    svcRef.current.textSearch(request, (places, status) => {
      setBusy(false);
      if (status !== google.maps.places.PlacesServiceStatus.OK || !places) return;
      const next = places.slice(0, 12).map((p) => ({
        id: p.place_id!, title: p.name ?? "Unknown", placeId: p.place_id,
        lat: p.geometry?.location?.lat(), lng: p.geometry?.location?.lng(), address: p.formatted_address,
      }));
      setResults(next);
    });
  }, [query]);

  const canUsePlaces = typeof window !== "undefined";

  return (
    <aside className={className}>
      <div className="sticky top-0 z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur p-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold">검색 및 추가</h3>
        <div className="mt-2 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="예: 하노이 분짜 맛집"
            className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!canUsePlaces || busy || !query.trim()}
            onClick={search}
            className="rounded-md px-3 py-2 text-sm bg-blue-600 text-white disabled:opacity-50"
          >
            검색
          </button>
        </div>
        {!canUsePlaces && <p className="mt-2 text-xs text-red-500">Google Maps JS가 로드되지 않았습니다.</p>}
      </div>

      <div className="p-3">
        <div className="text-xs text-gray-500 mb-2">결과 {results.length}건</div>
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div className="text-sm font-medium">{r.title}</div>
              {r.address && <div className="text-xs text-gray-500">{r.address}</div>}
              <div className="mt-2 flex flex-wrap gap-2">
                {days.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => onAddToDay(d.key, r)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                    title={`${d.dateLabel}에 추가`}
                  >
                    {d.dateLabel} 추가
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">빠른 작업</h4>
          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button key={d.key} type="button" onClick={() => onCreateNote?.(d.key)} className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700">
                {d.dateLabel} 메모 추가
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
