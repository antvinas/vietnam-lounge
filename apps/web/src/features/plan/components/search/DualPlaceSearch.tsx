// src/components/plan/DualPlaceSearch.tsx

import React, { useEffect, useRef, useState } from "react";
import { useRouteStore, PlacePick } from "@/store/useRouteStore";

const fields = ["place_id", "name", "geometry.location"] as const;

function useAC(ref: React.RefObject<HTMLInputElement>) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let on = true;
    (async () => {
      const { Autocomplete } =
        (await google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;
      if (!on || !ref.current) return;
      const ac = new Autocomplete(ref.current, {
        fields: fields as unknown as string[],
      });
      ac.addListener("place_changed", () => {
        const p = ac.getPlace();
        const g = p.geometry?.location;
        if (!g || !ref.current) return;
        const pick: PlacePick = {
          placeId: p.place_id ?? undefined,
          label: p.name ?? "",
          location: { lat: g.lat(), lng: g.lng() },
        };
        (ref.current as any).__onPick?.(pick);
      });
      setReady(true);
    })();
    return () => {
      on = false;
    };
  }, [ref]);
  return ready;
}

export default function DualPlaceSearch() {
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const setStart = useRouteStore((s) => s.setStart);
  const setEnd = useRouteStore((s) => s.setEnd);
  const swapEnds = useRouteStore((s) => s.swapEnds);
  const start = useRouteStore((s) => s.start);
  const end = useRouteStore((s) => s.end);

  const r1 = useAC(startRef);
  const r2 = useAC(endRef);

  useEffect(() => {
    if (startRef.current)
      (startRef.current as any).__onPick = setStart;
  }, [setStart, r1]);
  useEffect(() => {
    if (endRef.current) (endRef.current as any).__onPick = setEnd;
  }, [setEnd, r2]);

  // 외부 상태 변경 시 입력값 동기화
  useEffect(() => {
    if (startRef.current && start?.label)
      startRef.current.value = start.label;
  }, [start?.label]);
  useEffect(() => {
    if (endRef.current && end?.label)
      endRef.current.value = end.label;
  }, [end?.label]);

  const onSwap = () => {
    swapEnds();
    const a = startRef.current?.value ?? "";
    if (startRef.current && endRef.current) {
      startRef.current.value = endRef.current.value;
      endRef.current.value = a;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300">
        출발지
      </label>
      <div className="flex gap-2">
        <input
          ref={startRef}
          className="input-strong"
          placeholder="예: 노이바이 공항"
          aria-label="출발지 검색"
        />
        <button
          type="button"
          onClick={onSwap}
          className="h-11 w-11 shrink-0 rounded-xl border border-slate-300 bg-white text-lg text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          title="출발/도착 바꾸기"
          aria-label="출발지와 도착지 바꾸기"
        >
          ↔
        </button>
      </div>

      <label className="mt-2 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
        도착지
      </label>
      <input
        ref={endRef}
        className="input-strong"
        placeholder="예: 롯데호텔 하노이"
        aria-label="도착지 검색"
      />
    </div>
  );
}
